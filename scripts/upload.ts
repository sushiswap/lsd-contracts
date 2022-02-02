const path = require('path');
const fs = require('fs');
const client = require('ipfs-http-client')

const ipfsURL = 'ipfs://ipfs/'

var ipfs = client.create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' })

const metadata = {
	"name": "Bad Trip",
	"description": "The Bad Trip NFT is introduced as a celebratory piece for the announcement and and upcoming release of Sushi's Trident AMM. This NFT can be redeemed for a 19cm x 19cm 900 tab piece of blotter paper with this Chewy Stoll artwork printed on it.",
	"image": "",
	"properties": {
		"rich_property": {
			"name": "Artist",
			"value": "Chewy Stoll",
			"display_value": "Chewy Stoll",
			"class": "emphasis",
			"css": {
				"color": "#ffffff",
				"font-weight": "bold",
				"text-decoration": "underline"
			}
		}
	}
}

var addAndPinData = (data_) => {
    return new Promise((resolve, reject) => {
        const data = data_
        ipfs.add(data).then((result, err) => {
            if(err) reject(err)
            hash = result
            ipfs.pin.add(result.path).then((result, err) => {
                if(err) reject(err)
                resolve(hash.path)
            })
        })
    })
}

const readImage = (dir, file) => {
    return new Promise((resolve, reject) => {
        fs.readFile(dir + "/" + file, (err, image) => {
            if (err) {
                reject(err)
            }
            resolve(image)
        })
    });
}

readImage("./data", "BLOTTER-FINAL1.jpg")
  .then(addAndPinData).then((imgHash) => {
    metadata.image = ipfsURL + imgHash
    return JSON.stringify(metadata)
  })
  .then(addAndPinData)
  .then(result => {
    let obj = { uri: ipfsURL + result};
    return fs.writeFile('./data/uri.json', JSON.stringify(obj), function (err) {
        if (err) return console.log(err);
    });
  })

