/**
 * ============================================================
 * Yoleni Chemical AI - Routes
 * ============================================================
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  analyzeSubstances,
  analyzeFile,
  getHistory,
  getAnalysisById,
  deleteAnalysis,
  getStats,
} = require('../controllers/analysisController');

// Multer: armazenamento em memória para arquivos CSV/Excel
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['text/csv', 'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos CSV e Excel são suportados.'));
    }
  },
});

// Rotas de análise
router.post('/analyze', analyzeSubstances);
router.post('/analyze/file', upload.single('file'), analyzeFile);

// Rotas de histórico
router.get('/history', getHistory);
router.get('/history/stats', getStats);
router.get('/analysis/:id', getAnalysisById);
router.delete('/analysis/:id', deleteAnalysis);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Yoleni Chemical AI está funcionando!', timestamp: new Date() });
});

module.exports = router;
