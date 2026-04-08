const express = require('express');
const app = express();

app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/medecins', require('./routes/medecinRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/disponibilites', require('./routes/disponibiliteRoutes'));
app.use('/api/rendezvous', require('./routes/rendezvousRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

module.exports = app;
    