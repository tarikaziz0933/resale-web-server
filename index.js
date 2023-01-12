const express = require("express");
const app = express();
const cors = require("cors");
const {
    MongoClient,
    ServerApiVersion,
    ObjectId,
    ObjectID,
} = require("mongodb");
const port = process.env.PORT || 5000;

require("dotenv").config();

app.use(cors());
app.use(express.json());

const categories = require("./data/categories.json");
const products = require("./data/products.json");
const { json } = require("express");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ct9it9z.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});

async function run() {
    try {
        const categoryCollection = client.db("releaseWeb").collection("categories");
        const productCollection = client.db("releaseWeb").collection("products");
        const userCollection = client.db("releaseWeb").collection("users");
        const orderCollection = client.db("releaseWeb").collection("orders");
        const wishlistCollection = client.db("releaseWeb").collection("wishList");

        const advertisedCollection = client
            .db("releaseWeb")
            .collection("advertised");

        app.get("/categories", async (req, res) => {
            const query = {};
            const categories = await categoryCollection.find(query).toArray();
            res.send(categories);
        });

        app.get("/singleCategory", async (req, res) => {
            const category = req.query.category;
            const query = { category_name: category };
            const result = await categoryCollection.findOne(query);
            res.send(result);
        });

        app.get("/category/:id", async (req, res) => {
            const id = req.params.id;
            const query = {
                sub_category: id,
            };
            const product = await productCollection.find(query).toArray();
            res.send(product);
        });

        app.get("/user", async (req, res) => {
            const email = req.query.email;

            const query = { email: email };
            result = await userCollection.findOne(query);

            res.send(result);
        });

        app.get("/statusdUser", async (req, res) => {
            const status = req.query.status;
            const query = { status: status };

            const result = await userCollection.find(query).toArray();
            console.log(result);
            res.send(result);
        });

        app.get("/myProducts", async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const products = await productCollection.find(query).toArray();
            res.send(products);
        });

        app.put("/myProducts/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const option = { upsert: true };
            const updatedStatus = {
                $set: {
                    advertised: true,
                },
            };
            const result = await productCollection.updateOne(
                filter,
                updatedStatus,
                option
            );
            console.log(result);
            res.send(result);
        });

        //advertisedProducts
        app.get("/advertisedProducts", async (req, res) => {
            let range = req.query.range;
            range = parseInt(range);
            const query = {};
            const products = await advertisedCollection
                .find(query)
                .limit(range)
                .toArray();
            res.send(products);
        });

        app.get("/order", async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const orders = await orderCollection.find(query).toArray();
            res.send(orders);
        });

        app.get("/wishList", async (req, res) => {
            const email = req.query.email;
            const query = { buyer_email: email };
            const wishList = await wishlistCollection.find(query).toArray();
            res.send(wishList);
        });

        app.get("/buyers/myBuyer", async (req, res) => {
            const email = req.query.email;
            const query = { seller_email: email };
            const orders = await orderCollection.find(query).toArray();
            let users = [];

            orders.forEach((order) => {
                let matchedFound = false;
                users.forEach(user => {
                    if (user === order.email) {
                        matchedFound = true;
                    }
                })
                if (matchedFound === false) users.push(order.email);
            });
            // uses is the list of unique my ordered users.
            // now, find their info from userCollection

            const loginUsers = await userCollection.find({}).toArray();

            const myUsers = loginUsers.filter(loginUser => users.includes(loginUser.email));
            console.log(myUsers);

            res.send(myUsers);
        });

        app.post("/advertisedProducts", async (req, res) => {
            const advertisedItem = req.body;
            const query = {
                image_url: advertisedItem.image_url,
            };
            const isFound = await advertisedCollection.findOne(query);
            if (isFound) {
                res.send({ message: "alreadyAdded" });
            } else {
                const result = await advertisedCollection.insertOne(advertisedItem);
                res.send(result);
            }
        });

        app.post("/product", async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result);
        });

        app.post("/users", async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const alreadyUser = await userCollection.findOne(query);
            if (alreadyUser?.email === user?.email) {
                res.send({ message: "already a registered user" });
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        app.post("/order", async (req, res) => {
            const order = req.body;
            const query = {
                image_url: order.image_url,
                email: order.email,
            };
            const isFound = await orderCollection.findOne(query);
            if (isFound) {
                res.send({ message: "alreadyAdded" });
            } else {
                const result = await orderCollection.insertOne(order);
                res.send(result);
            }
        });

        app.post("/wishList", async (req, res) => {
            const wishItem = req.body;
            const query = {
                image_url: wishItem.image_url,
                buyer_email: wishItem.buyer_email,
            };
            const isFound = await wishlistCollection.findOne(query);
            if (isFound) {
                res.send({ message: "alreadyAdded" });
            } else {
                const result = await wishlistCollection.insertOne(wishItem);
                res.send(result);
            }
        });

        app.delete("/user/:id", async (req, res) => {
            const id = req.params;
            const filter = { _id: ObjectId(id) };
            const result = await userCollection.deleteOne(filter);
            console.log(result);
            res.send(result);
        });

        app.delete("/order/:id", async (req, res) => {
            const id = req.params;
            const filter = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(filter);
            res.send(result);
        });

        app.delete("/wishList/:id", async (req, res) => {
            const id = req.params;
            const filter = { _id: ObjectId(id) };
            const result = await wishlistCollection.deleteOne(filter);
            res.send(result);
        });
    } finally {
    }
}
run().catch((err) => console.log("Error: ", err));

app.listen(port, () => {
    console.log(`mongodb db server is running, ${port}`);
});
