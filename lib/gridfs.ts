import { GridFSBucket, MongoClient, ObjectId } from "mongodb";
import { Readable } from "stream";

let gridFSBucket: GridFSBucket | null = null;

export async function getGridFSBucket(): Promise<GridFSBucket> {
    if (!gridFSBucket) {
        const client = new MongoClient(
            process.env.MONGODB_URI || "mongodb://localhost:27017/wordyway"
        );
        await client.connect();
        const db = client.db();
        gridFSBucket = new GridFSBucket(db, { bucketName: "audio" });
    }
    return gridFSBucket;
}

export async function uploadAudioFile(
    filename: string,
    buffer: Buffer,
    metadata?: any
): Promise<string> {
    const bucket = await getGridFSBucket();
    const uploadStream = bucket.openUploadStream(filename, { metadata });

    return new Promise((resolve, reject) => {
        const readable = new Readable();
        readable.push(buffer);
        readable.push(null);

        readable
            .pipe(uploadStream)
            .on("error", reject)
            .on("finish", () => resolve(uploadStream.id.toString()));
    });
}

export async function getAudioFileStream(fileId: string): Promise<Readable> {
    const bucket = await getGridFSBucket();
    return bucket.openDownloadStream(new ObjectId(fileId));
}

export async function deleteAudioFile(fileId: string): Promise<void> {
    const bucket = await getGridFSBucket();
    await bucket.delete(new ObjectId(fileId));
}

export async function getAudioFileInfo(fileId: string): Promise<any> {
    const bucket = await getGridFSBucket();
    const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();
    return files[0] || null;
}
