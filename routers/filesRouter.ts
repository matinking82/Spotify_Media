import express from 'express';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { protect } from '../core/middlewares';
import ffpmeg from 'fluent-ffmpeg';

import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import dbContext from '../prisma/dbContext';


const storageImage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(path.join(__dirname, "../images"))) {
            fs.mkdirSync(path.join(__dirname, "../images"));
        }
        let dest = path.join(__dirname, "../images/");
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }

        cb(null, path.join(dest));
    },
    filename: function (req, file, cb) {
        let ext = path.extname(file.originalname);

        let availableExt = [".jpg", ".jpeg", ".png", ".gif"];

        if (!availableExt.includes(ext)) {
            return new Error("Only images are allowed");
        }

        let name = uuidv4() + ext;

        cb(null, name);
    },
});

const uploadImage = multer({ storage: storageImage });


const storageMusic = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(path.join(__dirname, "../musics"))) {
            fs.mkdirSync(path.join(__dirname, "../musics"));
        }
        let dest = path.join(__dirname, "../musics/");
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }

        cb(null, path.join(dest));
    },
    filename: function (req, file, cb) {
        let ext = path.extname(file.originalname);

        let availableExt = [".mp3"];

        if (!availableExt.includes(ext)) {
            return new Error("Only mp3 musics are allowed");
        }

        let name = uuidv4() + ext;

        cb(null, name);
    },
});


const uploadMusic = multer({ storage: storageMusic });

const router = express.Router();


router.get('/image/:key', async (req, res) => {
    //#swagger.tags = ['Files']
    //#swagger.description = 'Get an image file'
    let key = req.params.key;

    if (!key) {
        res.status(400).send('Key is required');
        return;
    }

    const image = await dbContext.image.findFirst({
        where: {
            key: key
        }
    });

    if (!image) {
        res.status(404).send('Image not found');
        return;
    }

    const imagename = image.path;

    //check if the image exists in images folder
    const imagePath = path.join(__dirname, '../images', imagename);

    if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
    }
    else {
        res.status(404).send('Image not found');
    }
});

router.get('/stream/:key', async (req, res) => {
    //#swagger.tags = ['Files']
    //#swagger.description = 'Stream a music file'

    let key = req.params.key;

    if (!key) {
        res.status(400).send('Key is required');
        return;
    }

    let music = await dbContext.music.findFirst({
        where: {
            key: key
        }
    });

    if (!music) {
        res.status(404).send('Music not found');
        return;
    }

    const musicfilename = music.path;

    // check if the music file exists in the music folder
    const musicPath = path.join(__dirname, '../musics', musicfilename);

    if (fs.existsSync(musicPath)) {
        const musicStream = fs.createReadStream(musicPath);
        const stat = fs.statSync(musicPath);
        const fileSize = stat.size;

        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': fileSize,
            'Content-Disposition': `attachment; filename=${musicfilename}`
        });

        musicStream.pipe(res);
    } else {
        res.status(404).send('Music file not found');
    }
});


router.get('/music/getSeconds/:key', async (req, res) => {
    //#swagger.tags = ['Files']
    //#swagger.description = 'Get the length of a music file in seconds'

    let key = req.params.key;

    if (!key) {
        res.status(400).send('Key is required');
        return;
    }

    let music = await dbContext.music.findFirst({
        where: {
            key: key
        }
    });

    if (!music) {
        res.status(404).send('Music not found');
        return;
    }

    if (music.seconds) {
        res.json({ success: true, seconds: music.seconds });
        return;
    }

    const musicfilename = music.path;

    // check if the music file exists in the music folder
    const musicPath = path.join(__dirname, '../musics', musicfilename);

    if (fs.existsSync(musicPath)) {
        ffpmeg.ffprobe(musicPath, async (err, metadata) => {
            if (err) {
                res.status(500).send('An error occurred while getting the length of the music file');
                return;
            }

            let duration = metadata.format.duration;

            dbContext.music.update({
                where: {
                    id: music.id
                },
                data: {
                    seconds: duration
                }
            });

            await dbContext.music.update({
                where: {
                    id: music.id
                },
                data: {
                    seconds: duration
                }
            });

            res.json({ success: true, seconds: duration });
        });
    } else {
        res.status(404).send('Music file not found');
    }
});

router.post('/image', protect, uploadImage.single('image'), async (req, res) => {
    //#swagger.tags = ['Files']
    //#swagger.auto = false
    //#swagger.description = 'Upload an image file'
    //#swagger.security = [{ "Bearer": [] }]
    /* #swagger.parameters['image'] = {
        in: 'formData',
        required: true,
        type: 'file',
        description: 'Image file to upload'
    } */
    /* #swagger.parameters['key'] = {
        in: 'formData',
        required: false,
        type: 'string',
        description: 'Key'
    } */
    /* #swagger.parameters['Authorization'] = {
        in: 'header',
        required: true,
        type: 'string',
        description: 'Bearer token'
    } */



    let file = req.file;

    if (!file) {
        res.status(400).send('Image is required');
        return;
    }

    let name = file.filename;
    let key = req.body.key;

    if (!key) {
        key = name;
    }

    await dbContext.image.create({
        data: {
            key: key,
            path: name
        }
    })

    res.json({ success: true, key: key });
    return;
});


router.post('/music', protect, uploadMusic.single('music'), async (req, res) => {
    //#swagger.tags = ['Files']
    //#swagger.auto = false
    //#swagger.description = 'Upload a music file'
    //#swagger.security = [{ "Bearer": [] }]
    /* #swagger.parameters['music'] = {
        in: 'formData',
        required: true,
        type: 'file',
        description: 'Music file to upload'
    } */
    /* #swagger.parameters['key'] = {
        in: 'formData',
        required: false,
        type: 'string',
        description: 'Key'
    } */
    /* #swagger.parameters['Authorization'] = {
        in: 'header',
        required: true,
        type: 'string',
        description: 'Bearer token'
    } */
    let file = req.file;

    if (!file) {
        res.status(400).send('Music is required');
        return;
    }

    let name = file.filename;

    let key = req.body.key;

    if (!key) {
        key = name;
    }

    await dbContext.music.create({
        data: {
            key: key,
            path: name
        }
    });

    res.json({ success: true, key: key });
    return;
});

export default router;