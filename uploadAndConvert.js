const express = require('express');
const multer = require('multer');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Multer: ファイルをアップロードする設定
const upload = multer({ dest: 'uploads/' });

// ファイルアップロード用のエンドポイント
app.post('/upload', upload.single('sb3File'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const sb3FilePath = path.join(__dirname, 'uploads', req.file.filename);
    const zipFilePath = sb3FilePath + '.zip';

    // 圧縮プロセス
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', {
        zlib: { level: 9 } // 圧縮レベル
    });

    output.on('close', function () {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');

        // 圧縮が完了したら、ダウンロードリンクを送信
        res.json({ zipUrl: `/download/${req.file.filename}.zip` });
    });

    archive.on('error', function (err) {
        throw err;
    });

    // 出力ファイルストリームをarchiverにパイプする
    archive.pipe(output);

    // .sb3 ファイルを追加して圧縮
    archive.file(sb3FilePath, { name: 'project.sb3' });

    // 圧縮完了
    archive.finalize();
});

// ダウンロード用のエンドポイント
app.get('/download/:zipFile', (req, res) => {
    const zipFilePath = path.join(__dirname, 'uploads', req.params.zipFile);
    res.download(zipFilePath);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
