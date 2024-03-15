import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin'

@Injectable()
export class DeviceService {
    constructor(@Inject('FirebaseAdmin') private readonly firebaseAdmin: admin.app.App) { }

    async pairDeviceWithUserId(userId: string, deviceId: string, deviceName: string) {

        // check if the device is already paired ? 
        // check from catalog 
        try {

            const userQuerySnapshot = await this.firebaseAdmin.firestore()
                .collection('Users')
                .where("uid", "==", userId)
                .limit(1)
                .get()

            const querySnapshot = await this.firebaseAdmin.firestore()
                .collection('DeviceCatalog')
                .where("deviceId", "==", deviceId)
                .limit(1)
                .get()

            const deviceQuerySnapshot = await this.firebaseAdmin.firestore()
                .collection('Devices')
                .where("deviceId", "==", deviceId)
                .limit(1)
                .get()


            if (!querySnapshot.empty && !userQuerySnapshot.empty && !deviceQuerySnapshot.empty) {

                const catalogData = querySnapshot.docs[0].data();
                const userData = userQuerySnapshot.docs[0].data();

                if (!catalogData['uid']) {

                    let updateStat
                    const catalogRef = querySnapshot.docs[0].ref;
                    const catalogUpdateStat = await catalogRef.update({ 'uid': userId })

                    const userRef = userQuerySnapshot.docs[0].ref;

                    let deviceList = new Array()

                    if (userData['deviceList']) {
                        console.log(" userData['deviceList'] ", userData['deviceList'])
                        deviceList = userData['deviceList']
                    }


                    deviceList.push(deviceId)
                    console.log("deviceList", deviceList)

                    const userUpdateStat = await userRef.update({ 'deviceList': deviceList })
                    const deviceUpdateStat = await deviceQuerySnapshot.docs[0].ref.update({
                        'deviceName': deviceName
                    })

                    updateStat = userUpdateStat && catalogUpdateStat && deviceUpdateStat
                    return updateStat

                } else {
                    return null;
                }

            } else {
                return null;
            }

        } catch (error) {
            return null;
        }
    }

    async checkPairDevice(deviceId: string) {
        try {
            const querySnapshot = await this.firebaseAdmin.firestore()
                .collection('DeviceCatalog')
                .where("deviceId", "==", deviceId)
                .limit(1)
                .get()

            if (!querySnapshot.empty) {

                const catalogData = querySnapshot.docs[0].data();

                if (!catalogData['uid']) {
                    return true
                } else {
                    return null;
                }

            } else {
                return null;
            }

        } catch (error) {
            return null;
        }

    }


    async unPairDeviceWithUserId(userId: string, deviceId: string) {

        // check if the device is already paired ? 
        // check from catalog 
        try {
            const deviceQuerySnapshot = await this.firebaseAdmin.firestore()
                .collection('Devices')
                .where("deviceId", "==", deviceId)
                .limit(1)
                .get()

            const userQuerySnapshot = await this.firebaseAdmin.firestore()
                .collection('Users')
                .where("uid", "==", userId)
                .limit(1)
                .get()

            const querySnapshot = await this.firebaseAdmin.firestore()
                .collection('DeviceCatalog')
                .where("deviceId", "==", deviceId)
                .limit(1)
                .get()

            if (!querySnapshot.empty && !userQuerySnapshot.empty && !deviceQuerySnapshot.empty) {

                const catalogData = querySnapshot.docs[0].data();
                const userData = userQuerySnapshot.docs[0].data();

                if (catalogData['uid']) {

                    let updateStat
                    const catalogRef = querySnapshot.docs[0].ref;
                    const catalogUpdateStat = await catalogRef.update({ 'uid': null })

                    const userRef = userQuerySnapshot.docs[0].ref;
                    const deviceRef = deviceQuerySnapshot.docs[0].ref;

                    let deviceList = new Array()
                    let filteredArray = new Array()

                    if (userData['deviceList']) {
                        deviceList = userData['deviceList']
                        filteredArray = deviceList.filter((value) => value !== deviceId);
                    }

                    if (userData['imageUrl']) {
                        const storage = admin.storage();
                        const filePath = `Devices/${deviceId}`;
                        const fileRef = storage.bucket().file(filePath);
                        fileRef.delete()
                            .then(() => {
                                console.log(`File ${filePath} deleted successfully.`);
                            })
                            .catch((error) => {
                                console.error(`Error deleting file ${filePath}:`, error);
                            });
                    }

                    const userUpdateStat = await userRef.update({ 'deviceList': filteredArray })

                    const deviceUpdateStat = await deviceRef.update({ 'deviceName': null, "imageUrl": null, 'status': null  , 'cameraState': null  , 'laserState':null })

                    updateStat = userUpdateStat && catalogUpdateStat && deviceUpdateStat

                    return updateStat

                } else {

                    return null;

                }

            } else {

                return null;

            }

        } catch (error) {
            return null;
        }
    }

    async editDevice(deviceId: string, deviceName: string, deviceImageUrl: string) {
        try {
            const deviceQuerySnapshot = await this.firebaseAdmin.firestore()
                .collection('Devices')
                .where("deviceId", "==", deviceId)
                .limit(1)
                .get()

            if (!deviceQuerySnapshot.empty) {

                const deviceRef = deviceQuerySnapshot.docs[0].ref;
                const deviceData = deviceQuerySnapshot.docs[0].data();


                let foundImageUrl = deviceData['imageUrl']

                if (foundImageUrl == null) {
                    foundImageUrl = deviceImageUrl
                }

                const deviceUpdateStat = await deviceRef.update({ 'deviceName': deviceName, "imageUrl": foundImageUrl })

                return deviceUpdateStat
            }
            else {
                return null
            }

        }
        catch (error) {
            return null
        }
    }

    async uploadImageToStorage(imageData: Uint8Array, deviceId: string): Promise<string> {

        try {

            // Convert the Uint8Array to a Buffer
            const buffer = Buffer.from(imageData);

            // Get the Firebase Storage bucket
            const bucket = admin.storage().bucket()

            // Upload the image to Firebase Storage with the filename as the user's UID
            await bucket.file(`Devices/${deviceId}`).save(buffer);

            const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/Devices%2F${deviceId}?alt=media`;

            console.log("downloadUrl", downloadUrl)

            return downloadUrl;

        } catch (error) {

            console.error('Error uploading image to storage:', error);

            throw error;

        }

    }

    async updateDeviceImageById(deviceId: string, imageUrl: string) {

        try {
            const deviceQuerySnapshot = await this.firebaseAdmin.firestore()
                .collection('Devices')
                .where("deviceId", "==", deviceId)
                .limit(1)
                .get()

            if (!deviceQuerySnapshot.empty) {

                const deviceData = deviceQuerySnapshot.docs[0].data();


                if (deviceData['deviceId'] === deviceId) {

                    const deviceRef = deviceQuerySnapshot.docs[0].ref;

                    return await deviceRef.update({ 'imageUrl': imageUrl })

                } else {

                    return null;

                }

            } else {

                return null;

            }

        } catch (e) {

            return null;

        }

    }
    async getImageUrl(deviceId: string): Promise<string | null> {
        try {

            const deviceQuerySnapshot = await this.firebaseAdmin.firestore()
                .collection('Devices')
                .where("deviceId", "==", deviceId)
                .limit(1)
                .get()

            if (!deviceQuerySnapshot.empty) {

                const imageUrl = deviceQuerySnapshot.docs[0].data()['imageUrl']

                console.log(imageUrl)

                return imageUrl

            }

        } catch (error) {

            console.error("Error getting image URL:", error)

            return null

        }
    }

    async getDeviceImage(deviceId: string) {
        try {
            const foundUrl = await this.getImageUrl(deviceId)
            console.log("i found image url:", foundUrl)
            if (foundUrl) {
                const storage = await this.firebaseAdmin.storage()
                const fileName = "Devices/" + deviceId
                const file = storage.bucket().file(fileName)

                const data = await new Promise((resolve, reject) => {
                    file.download()
                        .then(data => resolve(data[0]))
                        .catch(err => reject(err))
                })

                if (data) {
                    return data
                } else {
                    return null
                }
            } else {
                return null
            }

        } catch (e) {
            return null
        }

    }

    async getAvailableDevice(userId: string) {
        try {
            const querySnapshot = await this.firebaseAdmin.firestore()
                .collection('DeviceCatalog')
                .where("uid", "==", userId)
                .limit(1)
                .get()

            if (!querySnapshot.empty) {

                let availableStatusList = Array()

                for (let i = 0; i < querySnapshot.docs.length; i++) {

                    const pairedDevice = querySnapshot.docs[i].data()
                    const deviceId = pairedDevice['deviceId']

                    const deviceQuerySnapshot = await this.firebaseAdmin.firestore()
                        .collection('Devices')
                        .where("deviceId", "==", deviceId)
                        .limit(1)
                        .get()

                    const deviceData = deviceQuerySnapshot.docs[0].data()

                    const status = { 'deviceName': deviceData['deviceName'], 'status': deviceData['status'], 'deviceId': deviceData['deviceId'] }
                    availableStatusList.push(status)

                }

                return availableStatusList

            } else {
                // if not paired return empty list 
                return []
            }

        } catch (e) {
            return null
        }

    }

    async getHardwareState(userId: string, device_serial_code: string) {

        try {
            const deviceQuerySnapshot = await this.firebaseAdmin.firestore()
                .collection('Devices')
                .where("deviceId", "==", device_serial_code)
                .limit(1)
                .get()

            if (!deviceQuerySnapshot.empty) {

                const deviceData = deviceQuerySnapshot.docs[0].data();

                const cameraState = deviceData["cameraState"]
                const laserState = deviceData["laserState"]
                const communicationState = deviceData["status"]

                let hardwareState = { "cameraState" : cameraState , "laserState" : laserState , "status" : communicationState} 
                
                if( cameraState == null ){
                hardwareState['cameraState']="true";
                }
                if( laserState == null ){
                    hardwareState['laserState']="true";
                }
                if( communicationState == null){
                    hardwareState['status'] = "disconnected"
                }

                return hardwareState

            } else {
                // if not paired return empty list 
                return null
            }

        } catch (e) {
            return null
        }

    }
}
