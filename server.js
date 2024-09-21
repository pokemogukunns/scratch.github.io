const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/download/:projectId', async (req, res) => {
    const { projectId } = req.params;
    const scratchUrl = `https://projects.scratch.mit.edu/${projectId}.sb3`;

    try {
        const response = await axios({
            url: scratchUrl,
            method: 'GET',
            responseType: 'stream'
        });

        res.setHeader('Content-Disposition', `attachment; filename="${projectId}.sb3"`);
        response.data.pipe(res);
    } catch (error) {
        res.status(500).send('Failed to download the project');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
