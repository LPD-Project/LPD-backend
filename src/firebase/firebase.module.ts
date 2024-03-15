import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const pathxx = __dirname + './../../src/firebase/'
const filePath = path.join(pathxx, 'serviceKey.json');
const jsonData = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(jsonData);
const serviceAccountData = data.serviceAccount;

@Module({
    imports : [
        ConfigModule.forRoot({
            envFilePath : ['.env']
        })
    ],
    providers : [{
        provide : 'FirebaseAdmin' , 
        useFactory : () => {
            return admin.initializeApp({credential: admin.credential.cert(serviceAccountData) 
            ,storageBucket: 'gs://laserpigeondeterrent.appspot.com'});
        }
    }] , 
    exports: ['FirebaseAdmin'] ,
})


export class FirebaseModule {}