const express = require('express');
const app = express();
// ... API routes ...

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

module.exports = app; // This line is good!
