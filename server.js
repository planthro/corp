const express = require("express");
const app = express();
const { body, validationResult } = require("express-validator");
const cors = require("cors");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.engine("html", require("ejs").renderFile);
app.set("views", __dirname + "/views");

const stripe_secret =
	process.env.STRIPE_SECRET_KEY || "sk_test_sHcyJYvLwQVBqnfJxOxrGzCr";
const stripe_publishable =
	process.env.STRIPE_PUBLISHABLE_KEY || "pk_test_nqFcBu8J8qABVCsaic2fsQiL";

app.get("/", cors(), function (req, res) {
	res.render("support.html");
});

app.post(
	"/pintent",
	[body("name").trim(), body("email").isEmail().normalizeEmail(), cors()],
	async (req, res) => {
		// TO ADD: data validation, storing errors in an `errors` variable!
		const errors = validationResult(req);
		var amountErr = "";
		if (isNaN(req.body.amount)) {
			amountErr = "Invalid Amount";
			return res.status(400).json({ error: amountErr });
		}
		if (!errors.isEmpty()) {
			return res.status(400).json({ error: errors.array() });
		}
		const name = req.body.name;
		const email = req.body.email;
		const amount = req.body.amount;
		const currency = req.body.currency;
		try {
			const stripe = require("stripe")(stripe_secret);
			const paymentIntent = await stripe.paymentIntents.create({
				amount: amount * 100, // In cents
				currency: currency,
				receipt_email: email,
				metadata: { integration_check: "accept_a_payment" },
			});
			res.status(200).json({
				name: name,
				amount: amount,
				intentSecret: paymentIntent.client_secret,
				publishableKey: stripe_publishable,
			});
		} catch (err) {
			console.log("Error! ", err.message);
			res.status(500).json({ name: name, amount: amount, error: err.message });
		}
	}
);

app.listen(3000, function () {
	console.log("Running on port 3000");
});
