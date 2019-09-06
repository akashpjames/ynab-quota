import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage';
import { HTTP } from '@ionic-native/http/ngx';
import { AlertController, LoadingController } from '@ionic/angular';
import { CommonService } from '../services/common.service';

@Component({
    selector: 'app-tab4',
    templateUrl: 'tab4.page.html',
    styleUrls: ['tab4.page.scss']
})

export class Tab4Page implements OnInit {
    private apiToken: string;
    private headers: { Authorization: string };
    private budgets: any;
    public display = {
        apiToken: '',
        budget: '',
    };
    constructor(private storage: Storage, private http: HTTP,
        public alertController: AlertController, private commonService: CommonService,
        private loadingController: LoadingController) { }

    ngOnInit() {
        this.storage.get('apiToken').then((val) => {
            if (val != null) {
                this.apiToken = val;
                this.display.apiToken = `xxxxxxx-${this.apiToken.substr(-6)}`;
                this.headers = {
                    'Authorization': `Bearer ${val}`
                };
            } else {
                this.commonService.createToast('Access Token not available', 'dark');
            }
        });
    }

    doRefresh(event) {
        this.updateBudgets();
        setTimeout(() => {
            console.log('Refresh operation has ended');
            event.target.complete();
        }, 500);
    }

    async updateBudgets() {
        const loading = await this.loadingController.create({});
        loading.present().then(() => {
            this.http.get(`https://api.youneedabudget.com/v1/budgets/`, {}, this.headers).then(data => {
                this.budgets = JSON.parse(data.data).data.budgets;
                this.storage.set('budgets', JSON.stringify(this.budgets));
                this.commonService.createToast('Budgets updated successfully', 'dark');
                loading.dismiss();
            }).catch(error => {
                if (error.status === 401)
                    this.commonService.createToast('Add a valid Access token', 'dark');
                else this.commonService.createToast(error.error, 'danger');
                loading.dismiss();
            });
        });
    }

    redirectToSmsToYnab() {
        window.open('https://github.com/akashpjames/sms-import-for-ynab');
    }

    async updateAPI() {
        const alert = await this.alertController.create({
            header: 'Paste Access Token',
            inputs: [
                {
                    name: 'api',
                    type: 'text',
                    placeholder: 'Paste your access token'
                }
            ],
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    cssClass: 'secondary',
                    handler: () => {
                        console.log('Confirm Cancel');
                    }
                }, {
                    text: 'Set',
                    handler: (data) => {
                        this.apiToken = data.api;
                        this.headers = {
                            'Authorization': `Bearer ${this.apiToken}`
                        };
                        this.storage.set('apiToken', this.apiToken);
                        this.commonService.createToast('Access Token has been set', 'dark');
                        this.commonService.acessTokenRefreshRequired.categoriesPage = true;
                        if(this.apiToken.length) this.display.apiToken = `xxxxxxx-${this.apiToken.substr(-6)}`;
                        else this.display.apiToken = 'Not Set';
                        this.updateBudgets();
                    }
                }
            ]
        });
        await alert.present();
    }

}

