import React, { FC, useRef, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Snackbar,
    Stack,
    Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import Breadcrumb from "../common/Breadcrumb";
import { downloadBackup, restoreBackup } from "../../hooks/useBackup";

const bCrumb = [
    { to: "/", title: "Home" },
    { title: "Settings" },
];

export const Settings: FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [backupLoading, setBackupLoading] = useState(false);
    const [restoreLoading, setRestoreLoading] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
        open: false,
        message: "",
        severity: "success",
    });

    const showSnackbar = (message: string, severity: "success" | "error") =>
        setSnackbar({ open: true, message, severity });

    // ── Backup ──────────────────────────────────────
    const handleDownload = async () => {
        setBackupLoading(true);
        try {
            await downloadBackup();
            showSnackbar("Backup downloaded successfully!", "success");
        } catch (e: any) {
            showSnackbar(`Backup failed: ${e.message}`, "error");
        } finally {
            setBackupLoading(false);
        }
    };

    // ── Restore ─────────────────────────────────────
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setSelectedFile(file);
    };

    const handleRestoreClick = () => {
        if (!selectedFile) return;
        setConfirmOpen(true);
    };

    const handleRestoreConfirm = async () => {
        setConfirmOpen(false);
        if (!selectedFile) return;
        setRestoreLoading(true);
        try {
            await restoreBackup(selectedFile);
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            showSnackbar("Database restored successfully! Please refresh the page.", "success");
        } catch (e: any) {
            showSnackbar(`Restore failed: ${e.message}`, "error");
        } finally {
            setRestoreLoading(false);
        }
    };

    return (
        <>
            <Breadcrumb title="Settings" items={bCrumb} />

            <Stack spacing={3} mt={3} sx={{ maxWidth: 700 }}>

                {/* ── Backup Section ── */}
                <Card variant="outlined">
                    <CardContent>
                        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                            <DownloadIcon color="primary" />
                            <Typography variant="h6">Database Backup</Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            Download a complete snapshot of all your data as a JSON file.
                            Keep this file safe — you can use it to restore your data at any time.
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={backupLoading ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
                            onClick={handleDownload}
                            disabled={backupLoading}
                        >
                            {backupLoading ? "Downloading…" : "Download Backup"}
                        </Button>
                    </CardContent>
                </Card>

                <Divider />

                {/* ── Restore Section ── */}
                <Card variant="outlined" sx={{ borderColor: "warning.main" }}>
                    <CardContent>
                        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                            <UploadFileIcon color="warning" />
                            <Typography variant="h6">Restore from Backup</Typography>
                        </Stack>

                        <Alert severity="warning" sx={{ mb: 2 }}>
                            <strong>Warning:</strong> Restoring will permanently delete <strong>all current data</strong> and
                            replace it with the contents of the backup file. Make sure you have a recent backup before proceeding.
                        </Alert>

                        <Stack direction="row" spacing={2} alignItems="center">
                            <Button
                                variant="outlined"
                                component="label"
                                startIcon={<UploadFileIcon />}
                                color="warning"
                            >
                                Select Backup File
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json,application/json"
                                    hidden
                                    onChange={handleFileChange}
                                />
                            </Button>

                            {selectedFile && (
                                <Typography variant="body2" color="text.secondary">
                                    {selectedFile.name}
                                </Typography>
                            )}
                        </Stack>

                        <Box mt={2}>
                            <Button
                                variant="contained"
                                color="warning"
                                startIcon={restoreLoading ? <CircularProgress size={18} color="inherit" /> : <WarningAmberIcon />}
                                onClick={handleRestoreClick}
                                disabled={!selectedFile || restoreLoading}
                            >
                                {restoreLoading ? "Restoring…" : "Import Backup"}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            </Stack>

            {/* ── Confirmation Dialog ── */}
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>Confirm Restore</DialogTitle>
                <DialogContent>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        This will <strong>delete all existing data</strong> and replace it with the backup.
                        This action cannot be undone.
                    </Alert>
                    <Typography>
                        Are you sure you want to restore from <strong>{selectedFile?.name}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)} variant="outlined">Cancel</Button>
                    <Button onClick={handleRestoreConfirm} color="error" variant="contained">
                        Yes, Restore
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Snackbar ── */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};
