const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.fos1t9l.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

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
    }
    finally {

    }
}

run();



app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})