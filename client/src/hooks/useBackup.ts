const BASE_URL = `${process.env.REACT_APP_API_BASE_URL}/api`;

export const downloadBackup = async (): Promise<void> => {
    const response = await fetch(`${BASE_URL}/backup`);
    if (!response.ok) throw new Error("Backup download failed");

    const contentDisposition = response.headers.get("content-disposition") ?? "";
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    const filename = filenameMatch ? filenameMatch[1] : `persofi-backup-${new Date().toISOString().slice(0, 10)}.json`;

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

export const restoreBackup = async (file: File): Promise<void> => {
    const text = await file.text();
    const data = JSON.parse(text);
    const response = await fetch(`${BASE_URL}/backup/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ message: "Restore failed" }));
        throw new Error(err.message ?? "Restore failed");
    }
};
