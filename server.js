const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const app = express();
const logFilePath = path.join(__dirname, 'download-log.txt');

// ログをファイルに書き込む関数
const logToFile = (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}\n`;
    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) console.error("Failed to write to log file:", err);
    });
};

// ダウンロードエンドポイント
app.get('/download/:projectId', async (req, res) => {
    const projectId = req.params.projectId;
    const sb3Url = `https://projects.scratch.mit.edu/${projectId}`;
    const filePath = path.join(__dirname, `${projectId}.sb3`);

    logToFile(`Starting download for project ID: ${projectId}`);

    try {
        // Fetch the .sb3 file from the Scratch API
        const response = await fetch(sb3Url);

        logToFile(`Scratch API response status: ${response.status}`);

        // Check if the response is okay
        if (!response.ok) {
            const errorMessage = `Failed to download the project from Scratch. Status: ${response.status}`;
            logToFile(errorMessage);
            throw new Error(errorMessage);
        }

        // Create a write stream to save the file
        const fileStream = fs.createWriteStream(filePath);
        response.body.pipe(fileStream);

        // Log when the file is being written
        fileStream.on('open', () => logToFile(`Writing file to: ${filePath}`));

        // Finish writing the file
        fileStream.on('finish', () => {
            logToFile(`File download completed: ${filePath}`);
            res.download(filePath, `${projectId}.sb3`, (err) => {
                if (err) {
                    const downloadError = `Error during file download: ${err.message}`;
                    logToFile(downloadError);
                    res.status(500).send(downloadError);
                } else {
                    logToFile(`File successfully downloaded: ${projectId}.sb3`);

                    // Optionally, delete the file after download
                    fs.unlink(filePath, (err) => {
                        if (err) logToFile(`Failed to delete file: ${err.message}`);
                        else logToFile(`File deleted after download: ${filePath}`);
                    });
                }
            });
        });

        // Handle errors during file writing
        fileStream.on('error', (err) => {
            const writeError = `Error writing the file: ${err.message}`;
            logToFile(writeError);
            res.status(500).send(writeError);
        });

    } catch (error) {
        const generalError = `Error: ${error.message}`;
        logToFile(generalError);
        res.status(500).send(generalError);
    }
});

// サーバー開始
app.listen(process.env.PORT || 3000, () => {
    console.log('Server is running');
    logToFile('Server started and listening for requests.');
});
