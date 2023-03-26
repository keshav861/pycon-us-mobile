import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';


import { UserData } from '../../providers/user-data';

import { UserOptions } from '../../interfaces/user-options';



@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
  styleUrls: ['./login.scss'],
})
export class LoginPage {
  authUrl = 'https://d0972703210e.ngrok.app/2023/api/authenticate/';
  login: UserOptions = { email: '', password: '' };
  submitted = false;

  constructor(
    public userData: UserData,
    public router: Router,
    private http: HttpClient,
    private toastController: ToastController,
    private nav: NavController
  ) { }

  async presentError(message) {
    const toast = await this.toastController.create({
      message: 'Invalid Auth: ' + message,
      duration: 1000,
      position: 'top',
      icon: 'alert'
    });
    toast.present();
  }

  async presentSuccess(data) {
    const toast = await this.toastController.create({
      message: 'Success! Welcome, ' + data.nickname + '.',
      duration: 1000,
      position: 'top',
      icon: 'check'
    });
    toast.present();
  }

  onLogin(form: NgForm) {
    this.submitted = true;

    if (form.valid) {
      this.http.post(
          this.authUrl,
          {
            email: this.login.email,
            password: this.login.password
          }
      ).subscribe({
        next: data => {
          form.reset();
          this.userData.login(data);
          this.nav.navigateRoot('/');
          this.presentSuccess(data);
        },
        error: error => {
          console.log(error);
          if (error.error?.message) {
            this.presentError(error.error.message);
          }
        }
      });
    }
  }
}
