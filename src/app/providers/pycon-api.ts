import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { createHash } from 'sha1-uint8array';
//import { timeout } from 'rxjs/operators';

import { UserData } from './user-data';


@Injectable({
  providedIn: 'root'
})
export class PyConAPI {
  base = 'https://us.pycon.org'

  constructor(
    private userData: UserData,
    private toastController: ToastController,
    private http: HttpClient,
    private storage: Storage
  ) { }

  async presentSuccess(data) {
    const toast = await this.toastController.create({
      message: 'Captured lead for ' + data.first_name+ '.',
      duration: 1000,
      position: 'top',
      icon: 'check'
    });
    toast.present();
  }

  async syncScan(accessCode: string): Promise<any> {
    const pending = await this.storage.get('pending-scan-' + accessCode).then((value) => {
      return value
    });

    if (pending === null) {
      console.log('Unable to sync missing ' + accessCode);
    }

    const apiKey = await this.userData.getAuthKey().then((value) => {return value});
    const secret = await this.userData.getSecret().then((value) => {return value});

    const timestamp = Math.round(Date.now() / 1000)
    const baseString = [
      secret,
      timestamp,
      'GET',
      '/2023/api/lead-retrieval/capture/?' + 'attendee_access_code=' + accessCode,
      '',
    ].join("")

    console.log(baseString);
    const headers = {
      'X-API-Key': apiKey,
      'X-API-Signature': createHash().update(baseString).digest("hex"),
      'X-API-Timestamp': String(timestamp),
    }

    this.http.get(
      this.base + '/2023/api/lead-retrieval/capture/?attendee_access_code=' + accessCode,
      {headers: headers}
    ).subscribe({
      next: data => {
        console.log(data);
        this.storage.set('synced-scan-' + accessCode, pending).then((value) => {
          this.presentSuccess(data);
          this.storage.remove('pending-scan-' + accessCode).then((value) => {});
        });
      },
      error: error => {
      }
    });
  }

  async storeScan(accessCode: string, scanData: string): Promise<any> {
    const pending = await this.storage.get('pending-scan-' + accessCode).then((value) => {
      return value
    });
    const synced = await this.storage.get('synced-scan-' + accessCode).then((value) => {
      return value
    });
    console.log(pending, synced);
    if (synced != null) {
      console.log('Already captured ' + accessCode)
      return;
    } else if (pending != null) {
      console.log('Already scanned ' + accessCode)
      this.syncScan(accessCode);
      return;
    } else {
      return this.storage.set(
        'pending-scan-' + accessCode,
        {scanData: scanData, scannedAt: Date()}
      ).then(() => {
        console.log('Scanned ' + accessCode);
        this.syncScan(accessCode);
      }).catch((error) => {
        console.log('SCAN FAILED ' + accessCode);
      });
    }
  }
}
