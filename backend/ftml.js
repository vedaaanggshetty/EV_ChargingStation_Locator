// backend/ftml.js
const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');

router.post('/ftml/optimize', (req, res) => {
  const input = JSON.stringify(req.body);

  const py = spawn('python3', ['ftml_model/src/predict.py']);

  let dataBuffer = '';

  py.stdin.write(input);
  py.stdin.end();

  py.stdout.on('data', (data) => {
    dataBuffer += data.toString();
  });

  py.stderr.on('data', (err) => {
    console.error('Python error:', err.toString());
  });

  py.on('close', (code) => {
    try {
      const result = JSON.parse(dataBuffer);
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: 'Failed to parse model output' });
    }
  });
});

module.exports = router;
