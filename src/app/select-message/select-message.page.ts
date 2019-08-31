import { Component, OnInit } from '@angular/core';
import { NavController, ActionSheetController } from '@ionic/angular';
import { CommonService } from '../services/common.service';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { HTTP } from '@ionic-native/http/ngx';
import { Storage } from '@ionic/storage';
import { AlertController, LoadingController } from '@ionic/angular';

@Component({
    selector: 'app-select-message',
    templateUrl: './select-message.page.html',
    styleUrls: ['./select-message.page.scss']
})

export class SelectMessagePage implements OnInit {

    private budgets: any;
    private headers: { Authorization: string };
    public display = {
        budget: '',
        category: '',
        subCategory: ''
    };
    budgetInfo: { id: any; name: any; };
    categoryList: any;
    subCategoriesList: any;
    quotaData: any[];
    categoryInfo: { index: number, id: any; name: any; };

    constructor(public navCtrl: NavController,
        private commonService: CommonService,
        public androidPermissions: AndroidPermissions,
        public actionSheetController: ActionSheetController,
        private http: HTTP,
        private storage: Storage,
        private loadingController: LoadingController,
        private alertController: AlertController
    ) { }

    ngOnInit() {
        this.storage.get('apiToken').then((val) => {
            if (val != null) {
                this.headers = {
                    'Authorization': `Bearer ${val}`
                };
                this.updateBudgets();
            } else {
                this.commonService.createToast('Access token not available');
            }
        });

        this.storage.get('quota').then((val) => {
            if (val === null) {
                this.quotaData = [];
            } else {
                this.quotaData = JSON.parse(val);
            }
        });
    }

    async updateBudgets() {
        const loading = await this.loadingController.create({});
        loading.present().then(() => {
            this.http.get(`https://api.youneedabudget.com/v1/budgets/`, {}, this.headers).then(data => {
                this.budgets = JSON.parse(data.data).data.budgets;
                this.storage.set('budgets', JSON.stringify(this.budgets));
                this.commonService.createToast('Budgets updated successfully');
                loading.dismiss();
            }).catch(error => {
                if (error.status === 401)
                    this.commonService.createToast('Add a valid Access token');
                loading.dismiss();
            });
        });
    }

    async updateCategories() {
        const loading = await this.loadingController.create({});
        loading.present().then(() => {
            this.http.get(`https://api.youneedabudget.com/v1/budgets/${this.budgetInfo.id}/categories`, {}, this.headers).then(data => {
                this.categoryList = JSON.parse(data.data).data.category_groups;
                this.commonService.createToast('Choose the right category now');
                loading.dismiss();
            }).catch(error => {
                if (error.status === 401)
                    this.commonService.createToast('Add a valid Access token');
                loading.dismiss();
            });
        });
    }

    async setBudget() {
        const budgetInputs = [];
        for (const x of this.budgets) {
            budgetInputs.push({ type: 'radio', label: x.name, value: `${x.name} || ${x.id}` });
        }

        const alert = await this.alertController.create({
            header: 'Choose Budget',
            inputs: budgetInputs,
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    cssClass: 'secondary',
                    handler: () => {
                        console.log('Confirm Cancel');
                    }
                }, {
                    text: 'Ok',
                    handler: (data) => {
                        this.budgetInfo = {
                            id: data.split(' || ')[1],
                            name: data.split(' || ')[0]
                        };
                        this.display.budget = this.budgetInfo.name;
                        this.updateCategories();
                    }
                }
            ]
        });
        await alert.present();
    }

    async setCategory() {
        const categories = [];
        this.categoryList.forEach((category, i) => {
            categories.push({ type: 'radio', label: category.name, value: `${category.name} || ${i} || ${category.id}` });
        });

        const alert = await this.alertController.create({
            header: 'Choose category',
            inputs: categories,
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    cssClass: 'secondary',
                    handler: () => {
                        console.log('Confirm Cancel');
                    }
                }, {
                    text: 'Ok',
                    handler: (data) => {
                        this.commonService.createToast('Category has been set');
                        this.categoryInfo = {
                            index: data.split(' || ')[1],
                            name: data.split(' || ')[0],
                            id: data.split(' || ')[2]
                        };
                        this.display.category = this.categoryInfo.name;
                        this.subCategoriesList = this.categoryList[this.categoryInfo.index].categories;
                    }
                }
            ]
        });
        await alert.present();
    }

    async setSubCategory() {
        const subCategories = [];
        for (const x of this.subCategoriesList) {
            subCategories.push({ type: 'radio', label: x.name, value: `${x.name} || ${x.id}` });
        }

        const alert = await this.alertController.create({
            header: 'Choose Sub Category',
            inputs: subCategories,
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    cssClass: 'secondary',
                    handler: () => {
                        console.log('Confirm Cancel');
                    }
                }, {
                    text: 'Ok',
                    handler: (data) => {
                        this.commonService.createToast('Sub Category has been set');
                        const subCategoryInfo = {
                            id: data.split(' || ')[1],
                            name: data.split(' || ')[0]
                        };
                        this.display.subCategory = subCategoryInfo.name;
                        const details = {
                            sub_cat_id: subCategoryInfo.id,
                            cat_id: this.categoryInfo.id,
                            budget_id: this.budgetInfo.id,
                            name: subCategoryInfo.name
                        }
                        this.quotaData.push(details);
                    }
                }
            ]
        });
        await alert.present();
    }

    addMultiple(){
        this.storage.set('quota', JSON.stringify(this.quotaData));
        this.display.category = 'Not Set';
        this.display.subCategory = 'Not Set'
    }
    addCategory(){
        this.storage.set('quota', JSON.stringify(this.quotaData));
        this.navCtrl.navigateBack('tabs/tab1');
    }

    goBack() {
        this.navCtrl.navigateBack('tabs/tab2');
    }
}