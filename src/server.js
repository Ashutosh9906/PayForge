//predefined 
import express from "express";

const app = express();

//Custom made imports
import errorHandling from "./middlewares/errorHandling.js";
import userRoutes from "./routes/userRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import devRoutes from "./routes/devRoutes.js";

//middlewares
app.use(express.json());

//Custom routes
app.use("/users", userRoutes);
app.use("/accounts", accountRoutes);
app.use("/dev", devRoutes);

//central error handling middleware
app.use(errorHandling);

//Starting the server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});