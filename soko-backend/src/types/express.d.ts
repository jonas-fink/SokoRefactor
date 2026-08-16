declare namespace Express {
    interface Request {
        userId?: string;
        role?: 'user' | 'admin' | 'creator';
        /** Von `documentUploadHandler` geparste Datei — noch auf Platte, nicht in S3. */
        uploadedDocument?: { filepath: string; mimeType: string };
        /** Von `audioUploadHandler` geparste Sprachaufnahme — nur auf Platte,
         *  wird nach der Transkription sofort geloescht. */
        uploadedAudio?: { filepath: string; mimeType: string };
    }
}
