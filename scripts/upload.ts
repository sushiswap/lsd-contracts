const path = require('path');
const fs = require('fs');
const client = require('ipfs-http-client')

const ipfsURL = 'ipfs://ipfs/'

var ipfs = client.create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' })

const metadata = {
	"name": "Bad Trip",
	"description": "Lorem ipsum...",
	"image": "https:\/\/s3.amazonaws.com\/your-bucket\/images\/{id}.png",
	"properties": {
		"simple_property": "example value",
		"rich_property": {
			"name": "Name",
			"value": "123",
			"display_value": "123 Example Value",
			"class": "emphasis",
			"css": {
				"color": "#ffffff",
				"font-weight": "bold",
				"text-decoration": "underline"
			}
		},
		"array_property": {
			"name": "Name",
			"value": [1,2,3,4],
			"class": "emphasis"
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

readImage("./data", "02_Trident_Chewy Stoll_Loop_H264.mp4")
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

