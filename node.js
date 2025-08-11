const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch"); // don aika request zuwa Google

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const SECRET_KEY = "YOUR_SECRET_KEY";

app.post("/submit", async (req, res) => {
    const recaptchaResponse = req.body["g-recaptcha-response"];

    if (!recaptchaResponse) {
        return res.send("Please complete the reCAPTCHA");
    }

    // Tura zuwa Google don verify
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${6Ld-sqErAAAAAI7Nsb1AMAux_MpApIPLBqcmR3KH}&response=${recaptchaResponse}`;

    const googleResponse = await fetch(verifyUrl, { method: "POST" });
    const result = await googleResponse.json();

    if (result.success) {
        res.send("CAPTCHA verification passed ✅");
    } else {
        res.send("CAPTCHA verification failed ❌");
    }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
