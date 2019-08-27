import { Component } from '@angular/core';
import { Storage } from '@ionic/storage';
import { LoadingController, AlertController } from '@ionic/angular';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { HTTP } from '@ionic-native/http/ngx';
import { CommonService } from '../services/common.service';
// import { Queue } from './queue';


declare var require: any;
const reverseMustache = require('reverse-mustache');


declare var SMS: any;

@Component({
    selector: 'app-tab1',
    templateUrl: 'tab1.page.html',
    styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

    mykeys: any;
    messages: any = [];
    watchedMessages: any = [];
    templateToUse = '';
    templates: any = [];
    private timeToUpdate: any;
    expense: any = false;
    public syncedMessages: any = [];
    private syncedMessagesToPush: any = [];
    private messagesParsed: any;
    private responseRecvd: any;
    public showMeMessages: any;
    public showbuttons: any;
    private headers: { Authorization: string };
    private parsedMessagesTotal: number;
    public totalSyncs: number;
    quotaData: any
    budgetData: any;

    constructor(private storage: Storage,
        public commonService: CommonService,
        public androidPermissions: AndroidPermissions,
        private http: HTTP,
        private loadingController: LoadingController,
        public alertController: AlertController
    ) {
        this.mykeys = [];
        this.messagesParsed = 0;
        this.responseRecvd = 0;
        this.showMeMessages = false;
        this.showbuttons = false;

        // document.addEventListener('onSMSArrive', (e) => {
        //     this.storage.get('messages').then((val) => {
        //         if (val === null) {
        //             this.messages = [];
        //         } else {
        //             this.messages = JSON.parse(val);
        //         }
        //         this.messages.push((<any>e).data.body);
        //         this.storage.set('messages', JSON.stringify(this.messages));
        //
        //     });
        //     console.log(e);
        // });
    }

    ngOnInit() {
        // this.storage.get('totalSyncs').then((val) => {
        //     if (val === null) {
        //         this.totalSyncs = 0;
        //     } else {
        //         this.totalSyncs = val;
        //     }
        // });

        // this.storage.get('syncedMessages').then((val) => {
        //     if (val === null) {
        //         this.syncedMessages = [];
        //     } else {
        //         this.syncedMessages = JSON.parse(val);
        //     }
        // });

        this.storage.get('apiToken').then((val) => {
            if (val != null) {
                this.headers = {
                    'Authorization': `Bearer ${val}`
                };
                this.getQuotas();
            } else {
                this.commonService.createToast('Access Token not available');
            }
        });
    }

    doRefresh(event) {
        this.getQuotas();
        setTimeout(() => {
            event.target.complete();
        }, 1000);
    }


    getQuotas() {
        this.storage.get('quota').then((val) => {
            if (val != null) {
                this.getData(val);
            } else {
                this.commonService.createToast('No categories has been set');
            }
        });
    }

    async getData(categoryData) {
        const details = JSON.parse(categoryData);
        const loading = await this.loadingController.create({});
        loading.present().then(() => {
            this.http.get(`https://api.youneedabudget.com/v1/budgets/${details[0].budget_id}/categories/`, {}, this.headers).then(data => {
                this.budgetData = JSON.parse(data.data).data.category_groups;
                this.quotaData = [];
                details.forEach((val) => {
                    console.log(val);
                    var subcategoriesList = this.budgetData.filter(x => x.id === val.cat_id);
                    var categoryInformation = subcategoriesList[0].categories.filter(y => y.id === val.sub_cat_id);
                    this.quotaData.push(categoryInformation[0]);
                })
                loading.dismiss();
            }).catch(error => {
                if (error.status === 401)
                    this.commonService.createToast('Add a valid Access token');
                loading.dismiss();
            });
        });
    }


    clearTemplates() {
        this.storage.clear().then(() => {
            this.commonService.createToast('All templates have been cleared');
        });
    }

    showConfig() {
        this.showbuttons = !this.showbuttons;
    }

    showAllKeys() {
        this.storage.forEach((value, key) => {
            const obj = {
                key: key,
                value: value
            };
            this.mykeys.push(obj);
        });
    }

    deleteKey(data) {
        this.storage.remove(data.key);
    }

    updateLastTime() {
        const date = new Date();
        date.setDate(date.getDate() - 2);
        this.storage.set('lastUpdate', date);
    }

    showSMS() {
        this.storage.get('messages').then((val) => {
            if (val === null) {
                this.watchedMessages = [];
            } else {
                this.watchedMessages = JSON.parse(val);
            }
        });
    }
}
