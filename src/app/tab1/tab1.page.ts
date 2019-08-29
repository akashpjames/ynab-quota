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

    flipped: any = {};
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
                // this.getFakeData();
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

    flipCard(x) {
        console.log(x)
        if(this.flipped[x.id] === 'undefined') this.flipped[x.id] = true;
        else this.flipped[x.id] = !this.flipped[x.id];
        // this.flipped = !this.flipped;
    }

    getColor(value) {
        if (value.budgeted > 0) {
            const calculatedPercentage = value.balance * 100 / value.budgeted;
            switch (true) {
                case calculatedPercentage >=75:
                    return '#86e01e'
                    break;
                case calculatedPercentage >=50 && calculatedPercentage < 75:
                    return '#f2d31b'
                    break;
                case calculatedPercentage >=25 && calculatedPercentage < 50:
                    return '#f2b01e'
                    break;
                case calculatedPercentage >= 10 && calculatedPercentage < 25:
                    return '#f27011'
                    break;
                default:
                    return '#f63a0f'
                    break;
            }
        }
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
                    if (categoryInformation[0].budgeted > 0) categoryInformation[0].width = (categoryInformation[0].balance * 100 / categoryInformation[0].budgeted) + '%';
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


    getFakeData() {
        this.quotaData = [
            {
                "id": "d9587eef-8837-494b-a527-5d5c0f941dd0",
                "category_group_id": "14af761d-b74c-4062-8a92-693233b3a066",
                "name": "Water",
                "hidden": false,
                "original_category_group_id": null,
                "note": null,
                "budgeted": 1000000,
                "activity": -140000,
                "balance": 860000,
                "goal_type": null,
                "goal_creation_month": null,
                "goal_target": 0,
                "goal_target_month": null,
                "goal_percentage_complete": null,
                "deleted": false,
                "width": "86%"
            },
            {
                "id": "da18294f-16ce-4d12-9156-fb2b64a9ad7a",
                "category_group_id": "4a787888-7b9f-491e-acd3-a411b87c8d18",
                "name": "Eating Out",
                "hidden": false,
                "original_category_group_id": null,
                "note": null,
                "budgeted": 10000,
                "activity": -3000,
                "balance": 7000,
                "goal_type": null,
                "goal_creation_month": null,
                "goal_target": 0,
                "goal_target_month": null,
                "goal_percentage_complete": null,
                "deleted": false,
                "width": "70%"
            },
            {
                "id": "da18294f-16ce-4d12-9156-fb2b64a9ad7b",
                "category_group_id": "4a787888-7b9f-491e-acd3-a411b87c8d18",
                "name": "Fuel",
                "hidden": false,
                "original_category_group_id": null,
                "note": null,
                "budgeted": 10000,
                "activity": -3000,
                "balance": 6000,
                "goal_type": null,
                "goal_creation_month": null,
                "goal_target": 0,
                "goal_target_month": null,
                "goal_percentage_complete": null,
                "deleted": false,
                "width": "60%"
            },
            {
                "id": "da18294f-16ce-4d12-9156-fb2b64a9ad7c",
                "category_group_id": "4a787888-7b9f-491e-acd3-a411b87c8d18",
                "name": "Movies",
                "hidden": false,
                "original_category_group_id": null,
                "note": null,
                "budgeted": 10000,
                "activity": -3000,
                "balance": 5000,
                "goal_type": null,
                "goal_creation_month": null,
                "goal_target": 0,
                "goal_target_month": null,
                "goal_percentage_complete": null,
                "deleted": false,
                "width": "50%"
            },
            {
                "id": "da18294f-16ce-4d12-9156-fb2b64a9ad7d",
                "category_group_id": "4a787888-7b9f-491e-acd3-a411b87c8d18",
                "name": "Fun Money",
                "hidden": false,
                "original_category_group_id": null,
                "note": null,
                "budgeted": 10000,
                "activity": -3000,
                "balance": 4000,
                "goal_type": null,
                "goal_creation_month": null,
                "goal_target": 0,
                "goal_target_month": null,
                "goal_percentage_complete": null,
                "deleted": false,
                "width": "40%"
            },
            {
                "id": "da18294f-16ce-4d12-9156-fb2b64a9ad7e",
                "category_group_id": "4a787888-7b9f-491e-acd3-a411b87c8d18",
                "name": "Gift",
                "hidden": false,
                "original_category_group_id": null,
                "note": null,
                "budgeted": 10000,
                "activity": -3000,
                "balance": 3000,
                "goal_type": null,
                "goal_creation_month": null,
                "goal_target": 0,
                "goal_target_month": null,
                "goal_percentage_complete": null,
                "deleted": false,
                "width": "30%"
            },
            {
                "id": "da18294f-16ce-4d12-9156-fb2b64a9ad7f",
                "category_group_id": "4a787888-7b9f-491e-acd3-a411b87c8d18",
                "name": "Travel",
                "hidden": false,
                "original_category_group_id": null,
                "note": null,
                "budgeted": 10000,
                "activity": -3000,
                "balance": 2000,
                "goal_type": null,
                "goal_creation_month": null,
                "goal_target": 0,
                "goal_target_month": null,
                "goal_percentage_complete": null,
                "deleted": false,
                "width": "20%"
            },
            {
                "id": "da18294f-16ce-4d12-9156-fb2b64a9ad7g",
                "category_group_id": "4a787888-7b9f-491e-acd3-a411b87c8d18",
                "name": "Shopping",
                "hidden": false,
                "original_category_group_id": null,
                "note": null,
                "budgeted": 10000,
                "activity": -3000,
                "balance": 1000,
                "goal_type": null,
                "goal_creation_month": null,
                "goal_target": 0,
                "goal_target_month": null,
                "goal_percentage_complete": null,
                "deleted": false,
                "width": "10%"
            },
            {
                "id": "da18294f-16ce-4d12-9156-fb2b64a9ad7h",
                "category_group_id": "4a787888-7b9f-491e-acd3-a411b87c8d18",
                "name": "Groceries",
                "hidden": false,
                "original_category_group_id": null,
                "note": null,
                "budgeted": 10000,
                "activity": -3000,
                "balance": 500,
                "goal_type": null,
                "goal_creation_month": null,
                "goal_target": 0,
                "goal_target_month": null,
                "goal_percentage_complete": null,
                "deleted": false,
                "width": "5%"
            },
        ]
    }
}
