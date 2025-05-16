import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;


app.use(express.json());
app.use(cors());


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Server error' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

