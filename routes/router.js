const express = require("express");
const router = new express.Router();
const Products = require("../models/productsSchema");
const USER = require("../models/userSchema");
const bcrypt = require("bcryptjs");
const athenticate = require("../middleware/authenticate");
const stripe = require('stripe')(process.env.STRIPE_KEY)

// get productsdata api
router.get("/", (req, res) => {
    console.log("Your Started the server")
    res.send("Your Started the server")
})
router.get("/getproducts", async (req, res) => {
    try {
        const productsdata = await Products.find();
        // console.log("console the data" +  productsdata);
        res.status(201).json(productsdata);
    } catch (error) {
        console.log("error" + error.message);
    }
});


// get individual data
router.get("/getproductsone/:id", async (req, res) => {
    try {
        const { id } = req.params;
        // console.log(id);

        const individuadata = await Products.findOne({ id: id });

        // console.log(individuadata + "individual data");

        res.status(201).json(individuadata);

    } catch (error) {
        res.status(400).json(individuadata);
        console.log("error" + error.message);
    }
});

// register data

router.post("/register", async (req, res) => {
    console.log(req.body);

    const { fname, email, mobile, password, cpassword } = req.body;

    if (!fname || !email || !mobile || !password || !cpassword) {
        res.status(422).json({ error: "fill the all data" });
        console.log("not data available");
        return;
    };


    try {
        const preuser = await USER.findOne({ email: email });

        if (preuser) {
            res.status(422).json({ error: "this user is already present" })
        } else if (password !== cpassword) {
            res.status(422).json({ error: "password and cpassword not match" })
        } else {
            const finalUser = new USER({
                fname, email, mobile, password, cpassword
            });

            // harsh -> encrypt  hujug ->> decrypt-> harsh
            // bcryptjs 

            // password hasing process

            const storedata = await finalUser.save();
            console.log(storedata, "savedUser");

            res.status(201).json(storedata);
        }



    } catch (error) {
        res.status(401).json(error);
    }

});


// login user api

// router.post("/login", async (req, res) => {
//     const { email, password } = req.body;
//     if (!email || !password) {
//         res.status(400).json({ error: "fill the all data" })
//     };

//     try {
//         const userlogin = await USER.findOne({ email: email });
//         // console.log(userlogin + "user value");

//         if (userlogin) {
//             const isMatch = await bcrypt.compare(password, userlogin.password);
//             // console.log(isMatch + "pass match");

//             if (!isMatch) {
//                 res.status(400).json({ error: "invalid detials" });
//             } else {

//                 const token = await userlogin.generateAuthtokenn();
//                 // console.log(token);
//                 const options = {
//                     httpOnly: true,
//                     secure: true
//                 }
//                 res.cookie("accessToken", token, options)
//                 res.status(201).json(userlogin);

//             }

//         } else {
//             res.status(400).json({ error: "invalid detials" })
//         }
//     } catch (error) {
//         res.status(400).json({ error: "invalid detials" })
//     }
// })

// router.post("/login", async (req, res) => {
//     const { email, password } = req.body;

//     if (!email || !password) {
//         return res.status(400).json({ error: "Please fill in all the required fields" });
//     }

//     try {
//         const userlogin = await USER.findOne({ email: email });

//         if (!userlogin) {
//             return res.status(400).json({ error: "Invalid email or password" });
//         }

//         const isMatch = await bcrypt.compare(password, userlogin.password);

//         if (!isMatch) {
//             return res.status(400).json({ error: "Invalid email or password" });
//         }

//         const token = await userlogin.generateAuthtokenn();

//         if (!token) {
//             return res.status(500).json({ error: "Failed to generate authentication token" });
//         }

//         const options = {
//             httpOnly: true,
//             secure: true
//         };

//         res.cookie("accessToken", token, options);
//         return res.status(200).json(userlogin);

//     } catch (error) {
//         console.error("Error during login:", error);
//         return res.status(500).json({ error: "Internal server error" });
//     }
// });

// adding the data into cart

router.post("/addcart/:id", athenticate, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(id, "cart")
        const cart = await Products.findOne({ id: id });
        console.log(cart + "cart value12345");

        const UserContact = await USER.findOne({ _id: req.userID });
        console.log(UserContact);


        if (UserContact) {
            const cartData = await UserContact.addcartdata(cart);
            await UserContact.save();
            console.log(cartData);
            res.status(201).json(UserContact);
        } else {
            res.status(401).json({ error: "invalid user" });
        }


    } catch (error) {
        res.status(401).json({ error: "invalid user" });
    }
});

// get cart details

router.get("/cartdetails", athenticate, async (req, res) => {
    try {
        const buyuser = await USER.findOne({ _id: req.userID });
        // console.log(buyuser.carts)
        res.status(201).json(buyuser);
    } catch (error) {
        console.log("error" + error)
    }
})


// get valid user

router.get("/validuser", athenticate, async (req, res) => {
    try {
        const validuserone = await USER.findOne({ _id: req.userID });
        res.status(201).json(validuserone);
    } catch (error) {
        console.log("error" + error)
    }
})


// remove item from cart
router.delete("/remove/:id", athenticate, async (req, res) => {
    try {
        const { id } = req.params;

        req.rootUser.carts = req.rootUser.carts.filter((cruval) => {
            return cruval.id != id;
        });

        req.rootUser.save();
        res.status(201).json(req.rootUser);
        console.log("item remove");
    } catch (error) {
        console.log("error hain" + error);
        res.status(400).json(req.rootUser);
    }
})
router.get("/lougout", (req, res) => {
    try {
        req.rootUser.tokens = req.rootUser.tokens.filter((curelem) => {
            return curelem.token !== req.token
        });


        res.clearCookie("accessToken", { path: "/" });

        req.rootUser.save();
        res.status(201).json(req.rootUser.tokens);
        console.log("uuser logout");
    } catch (error) {
        // res.status(01).json(req.rootUser.toekns);
        console.log("error for user logout");
    }
})

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(email, password)
    if (!email || !password) {
        return res.status(400).json({ error: "Please fill in all the required fields" });
    }
    try {

        const userlogin = await USER.findOne({ email: email });
        if (!userlogin) {
            return res.status(400).json({ error: "Invalid email or password" });
        }
        const isMatch = await bcrypt.compare(password, userlogin.password);

        if (!isMatch) {
            return res.status(400).json({ error: "Invalid email or password" });
        }
        const token = await userlogin.generateAuthtokenn();

        if (!token) {
            return res.status(500).json({ error: "Failed to generate authentication token" });
        }

        const options = {
            httpOnly: true,
            secure: true
        };
        res.cookie("accessToken", token, options);
        return res.status(200).json(userlogin);
    } catch (error) {
        console.log(error)
    }



});




router.post('/stripe/create-checkout-session', athenticate, async (req, res) => {
    const { iteam } = req.body;
    const lineItems = iteam.map((product) => ({
        price_data: {
            currency: "inr", // Use "inr" for Indian Rupee
            product_data: {
                name: product.title.shortTitle,
                images: [product.url] // Pass an array of image URLs
            },
            unit_amount: product.price.cost * 100 // Stripe requires the amount to be in the smallest currency unit (e.g., paise)
        },
        quantity: 1
    }));


    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: "http://localhost:3000/",
            cancel_url: "http://localhost:3000/login"
        });

        res.json(session.id);
    } catch (error) {
        console.error("Error creating Stripe session:", error);
        res.status(500).json({ error: "Failed to create Stripe session" });
    }
});

module.exports = router;













// console.log(isMatch);

// res.cookie('rememberme', token, { expires: new Date(Date.now() + 900000), httpOnly: true });