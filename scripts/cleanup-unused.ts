import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
    Project,
    ImportDeclaration,
    Node,
    SyntaxKind,
    VariableDeclaration,
    FunctionDeclaration,
    ClassDeclaration,
    SourceFile,
    ImportSpecifier,
    Identifier,
} from "ts-morph";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");
const reportsDir = path.join(projectRoot, "reports");
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

const nextProtectedSegments = new Set([
    "page.tsx",
    "layout.tsx",
    "template.tsx",
    "loading.tsx",
    "error.tsx",
    "not-found.tsx",
    "route.ts",
]);

const httpHandlerNames = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

const isProtectedFile = (filePath: string): boolean => {
    const rel = path.relative(projectRoot, filePath).replace(/\\/g, "/");
    if (rel.startsWith("node_modules/") || rel.startsWith(".next/")) return true;
    if (rel.startsWith("app/")) {
        const base = path.basename(rel);
        if (nextProtectedSegments.has(base)) return true;
    }
    if (rel === "middleware.ts" || rel === "middleware.tsx") return true;
    return false;
};

const isApiRouteFile = (filePath: string): boolean => {
    const rel = path.relative(projectRoot, filePath).replace(/\\/g, "/");
    return rel.startsWith("app/") && rel.endsWith("/route.ts");
};

const hasNonImportUsage = (node: Node): boolean => {
    if (!Node.isIdentifier(node)) return true; // be conservative if not an Identifier
    const refSyms = (node as Identifier).findReferences();
    for (const rs of refSyms) {
        for (const ref of rs.getReferences()) {
            const n = ref.getNode();
            if (!n.getFirstAncestorByKind(SyntaxKind.ImportDeclaration)) return true;
        }
    }
    return false;
};

const removeUnusedImports = (source: SourceFile): number => {
    let removed = 0;
    source.getImportDeclarations().forEach((imp: ImportDeclaration) => {
        if (!imp.getDefaultImport() && imp.getNamespaceImport() == null && imp.getNamedImports().length === 0) return;

        imp.getNamedImports().forEach((spec: ImportSpecifier) => {
            const id = spec.getNameNode();
            if (!hasNonImportUsage(id)) {
                spec.remove();
                removed++;
            }
        });

        const def = imp.getDefaultImport();
        if (def && !hasNonImportUsage(def)) {
            imp.removeDefaultImport();
            removed++;
        }

        const ns = imp.getNamespaceImport();
        if (ns && !hasNonImportUsage(ns)) {
            imp.removeNamespaceImport();
            removed++;
        }

        if (!imp.getDefaultImport() && !imp.getNamespaceImport() && imp.getNamedImports().length === 0) {
            imp.remove();
            removed++;
        }
    });
    return removed;
};

const convertTypeOnlyImports = (source: SourceFile): number => {
    let converted = 0;
    source.getImportDeclarations().forEach((imp) => {
        imp.getNamedImports().forEach((spec) => {
            const idNode = spec.getNameNode();
            if (!Node.isIdentifier(idNode)) return; // only analyze identifiers
            const refSyms = idNode.findReferences();
            const refNodes = refSyms.flatMap((rs) => rs.getReferences().map((r) => r.getNode()));
            const nonImportRefs = refNodes.filter((n) => !n.getFirstAncestorByKind(SyntaxKind.ImportDeclaration));
            if (nonImportRefs.length === 0) return;
            const usedOnlyInTypes = nonImportRefs.every((n) => {
                const p = n.getParent();
                return (
                    Node.isTypeNode(n) ||
                    (p && (
                        Node.isTypeReference(p) ||
                        Node.isHeritageClause(p) ||
                        Node.isTypeAliasDeclaration(p) ||
                        Node.isInterfaceDeclaration(p) ||
                        Node.isTypeLiteral(p) ||
                        Node.isImportTypeNode(p)
                    ))
                );
            });
            if (usedOnlyInTypes && !spec.isTypeOnly()) {
                spec.setIsTypeOnly(true);
                converted++;
            }
        });

        const hasValueImport = Boolean(imp.getDefaultImport() || imp.getNamespaceImport());
        if (!hasValueImport) {
            const named = imp.getNamedImports();
            if (named.length > 0 && named.every((s) => s.isTypeOnly())) {
                if (!imp.isTypeOnly()) {
                    imp.setIsTypeOnly(true);
                    converted++;
                }
            }
        }
    });
    return converted;
};

const isExportedDeclaration = (decl: Node): boolean => {
    if (Node.isFunctionDeclaration(decl) || Node.isClassDeclaration(decl)) {
        return (decl as FunctionDeclaration | ClassDeclaration).isExported();
    }
    if (Node.isVariableDeclaration(decl)) {
        const vs = (decl as VariableDeclaration).getVariableStatement();
        return vs ? vs.isExported() : false;
    }
    return false;
};

const removeUnusedLocalsAndInternals = (source: SourceFile): number => {
    let removed = 0;

    const canRemoveDeclaration = (decl: Node): boolean => {
        if (isExportedDeclaration(decl)) return false;

        if (Node.isFunctionDeclaration(decl) || Node.isClassDeclaration(decl)) {
            const nameNode = (decl as FunctionDeclaration | ClassDeclaration).getNameNode();
            if (!nameNode || !Node.isIdentifier(nameNode)) return false;
            const refs = nameNode.findReferences();
            const nodes = refs.flatMap((rs) => rs.getReferences().map((r) => r.getNode()));
            const nonSelfRefs = nodes.filter((n) => !(Node.isIdentifier(n) && n.getParent()?.getKind() === decl.getKind()));
            return nonSelfRefs.length === 0;
        }

        if (Node.isVariableDeclaration(decl)) {
            const nameNode = (decl as VariableDeclaration).getNameNode();
            if (!Node.isIdentifier(nameNode)) return false; // skip destructuring conservatively
            const refs = nameNode.findReferences();
            const nodes = refs.flatMap((rs) => rs.getReferences().map((r) => r.getNode()));
            const nonSelfRefs = nodes.filter((n) => !(Node.isIdentifier(n) && n.getParent()?.getKind() === SyntaxKind.VariableDeclaration));
            return nonSelfRefs.length === 0;
        }

        return false;
    };

    source.getVariableStatements().forEach((vs) => {
        vs.getDeclarations().forEach((vd: VariableDeclaration) => {
            if (canRemoveDeclaration(vd)) {
                vd.remove();
                removed++;
            }
        });
        if (vs.getDeclarations().length === 0) {
            vs.remove();
            removed++;
        }
    });

    source.getFunctions().forEach((fn: FunctionDeclaration) => {
        if (fn.isDefaultExport()) return;
        if (canRemoveDeclaration(fn)) {
            fn.remove();
            removed++;
        }
    });

    source.getClasses().forEach((cls: ClassDeclaration) => {
        if (cls.isDefaultExport()) return;
        if (canRemoveDeclaration(cls)) {
            cls.remove();
            removed++;
        }
    });

    return removed;
};

const containsApiHandler = (source: SourceFile): boolean => {
    if (!isApiRouteFile(source.getFilePath())) return false;
    return source.getFunctions().some((fn) => {
        if (!fn.isExported()) return false;
        const name = fn.getName();
        return Boolean(name && httpHandlerNames.has(name));
    });
};

const main = async () => {
    const project = new Project({
        tsConfigFilePath: path.join(projectRoot, "tsconfig.json"),
        skipAddingFilesFromTsConfig: false,
        skipFileDependencyResolution: true,
    });

    const sourceFiles = project
        .getSourceFiles()
        .filter(
            (sf) =>
                !sf.getFilePath().includes("node_modules") &&
                !sf.getFilePath().includes(`${path.sep}.next${path.sep}`) &&
                (sf.getFilePath().endsWith(".ts") || sf.getFilePath().endsWith(".tsx"))
        );

    let filesScanned = 0;
    let importsRemoved = 0;
    let typeImportsConverted = 0;
    let definitionsRemoved = 0;

    for (const source of sourceFiles) {
        const filePath = source.getFilePath();
        if (isProtectedFile(filePath)) continue;

        filesScanned++;

        const isApi = isApiRouteFile(filePath);

        typeImportsConverted += convertTypeOnlyImports(source);
        importsRemoved += removeUnusedImports(source);

        if (!isApi && !containsApiHandler(source)) {
            definitionsRemoved += removeUnusedLocalsAndInternals(source);
        }

        source.formatText({});
    }

    await project.save();

    const summary = [
        `Files scanned: ${filesScanned}`,
        `Imports removed: ${importsRemoved}`,
        `Type-only imports converted: ${typeImportsConverted}`,
        `Local definitions removed: ${definitionsRemoved}`,
    ].join("\n");

    console.log(summary);
    fs.writeFileSync(path.join(reportsDir, "cleanup-summary.txt"), summary, "utf8");
};

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
