const bigml = require("bigml");
const fs = require("fs");
const mongodb = require('./mongodb');

const fsPromises = fs.promises;

// https://bigml.com/dashboard/datasets
const connection = new bigml.BigML('LIORATIYA', '32c48e9131baa4930cb24d5f094a0e6b12d7de01')
const source = new bigml.Source(connection);

const BigML = {
    // Create a new model (using the category entries records from mongoDB)
    createModel: async function () {
        records = await mongodb.export2csv();
        // if (records == 0) {
        //   console.log(`Didn't find any records in the category entries: ${categoryEntries}`);
        //   return 0;
        // }
        await sleep(200);
        try {
            var sourceInfoV = await sourceInfo();
            const dataset = new bigml.Dataset(connection);
            var datasetInfoV = await datasetInfo(dataset, sourceInfoV);
            var model = new bigml.Model(connection);
            var modelInfoV = await modelInfo(model, datasetInfoV);
        } catch (err) {
            console.log("BigML 'createModel' error: " + err);
        }
        var fileName = "model.txt";
        await fsPromises
            .writeFile(fileName, modelInfoV.object.resource)
            .then(() => {
                console.log("\u001b[35m" + `Model Created!` + "\u001b[0m");
            })
            .catch((er) => {
                console.log("BigML write to " + fileName + " error: " + er);
            });
        return records;
    },

    // BigML assumes that the parameter we want to predict is in the last column
    predictAll: async function (toPredict) {

        var prediction = new bigml.Prediction(connection);
        var resultPromises = [];
        resultValues = [];
        try {
            var promise = BigML.predict(prediction, toPredict);
            // If the promise throws error don't add it
            if (promise != null) {
                resultPromises.push(promise);
            }
        } catch (err) {
            console.log("BigML 'predictAll' promises error: " + err);
        }
        // }
        await Promise.all(resultPromises)
            .then((values) => {
                resultValues = values;
            })
            .catch((er) => {
                console.log("BigML predictAll error: " + er);
            });

        return resultValues;
    },

    // BigML assumes that the parameter we want to predict is in the last column
    predict: async function (prediction, toPredict) {
        var res;
        await fsPromises
            .readFile("model.txt", "utf8")
            .then(async function (data) {
                await predictBigML(prediction, data, toPredict)
                    .then(function (predictionV) {
                        //here when you resolve
                        var result = predictionV.object.output + "";
                        res = result;
                    })
                    .catch(function (rej) {
                        //here when you reject the promise
                        console.log("BigML single predict rejection: " + rej);
                        res = null;
                    });
            })
            .catch((er) => {
                console.log("BigML predict error: " + er);
                res = null;
            });
        return res;
    },

};

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

// The following three functions intended for creating a BigML model
async function sourceInfo() {
    return new Promise(async function (resolve, reject) {
        await source.create("EntrancesDetails.csv", async function (error, sourceInfo) {
            if (!error && sourceInfo) {
                resolve(sourceInfo);
            } else {
                reject("BigML sourceInfo error: " + error);
            }
        });
    });
}

async function datasetInfo(dataset, sourceInfo) {
    return new Promise(async function (resolve, reject) {
        await dataset.create(sourceInfo, async function (error, datasetInfo) {
            if (!error && datasetInfo) {
                resolve(datasetInfo);
            } else {
                reject("BigML datasetInfo error: " + error);
            }
        });
    });
}

async function modelInfo(model, datasetInfo) {
    return new Promise(async function (resolve, reject) {
        await model.create(datasetInfo, async function (error, modelInfo) {
            if (!error && modelInfo) {
                resolve(modelInfo);
            } else {
                reject("BigML modelInfo error: " + error);
            }
        });
    });
}

// The following function intended for BigML prediction
async function predictBigML(prediction, data, toPredict) {
    return new Promise(async function (resolve, reject) {
        await prediction.create(data, toPredict, async function (error, prediction) {
            if (!error && prediction) {
                resolve(prediction);
            } else {
                reject("BigML prediction error: " + error);
            }
        });
    });
}

module.exports = BigML;