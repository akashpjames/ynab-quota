import { Component } from '@angular/core';
import { Storage } from '@ionic/storage';
import { LoadingController, AlertController } from '@ionic/angular';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { HTTP } from '@ionic-native/http/ngx';
import { CommonService } from '../services/common.service';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-tab1',
    templateUrl: 'tab1.page.html',
    styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

    flipped: any = {};
    mykeys: any;
    templateToUse = '';
    templates: any = [];
    expense: any = false;
    public showbuttons: boolean;
    private headers: { Authorization: string };
    public totalSyncs: number;
    quotaData: any = [];
    budgetData: any;
    currencyFormat: any;
    intialLoading: boolean = true;

    constructor(private storage: Storage,
        public commonService: CommonService,
        public androidPermissions: AndroidPermissions,
        private http: HTTP,
        private loadingController: LoadingController,
        public alertController: AlertController,
        route:ActivatedRoute
    ) {
        route.params.subscribe(val => {
            if(this.commonService.refreshRequired.homePage){
                this.ngOnInit();
                this.commonService.refreshRequired.homePage = false;
            }
          });
        this.mykeys = [];
        this.showbuttons = false;
    }

    ngOnInit() {
        this.storage.get('apiToken').then((val) => {
            if (val != null) {
                this.headers = {
                    'Authorization': `Bearer ${val}`
                };
                this.getQuotas();
            } else {
                this.commonService.createToast('Access Token not available', 'dark');
            }
        });

        this.storage.get('budgets').then((val) => {
            if (val != null) {
                this.currencyFormat = JSON.parse(val)[0].currency_format;
                console.log(this.currencyFormat);
            } else {
                this.commonService.createToast('Access Token not available', 'dark');
            }
        })
    }

    doRefresh(event) {
        if (!this.headers) {
            this.storage.get('apiToken').then((val) => {
                if (val != null) {
                    this.headers = {
                        'Authorization': `Bearer ${val}`
                    };
                    this.getQuotas();
                } else {
                    this.commonService.createToast('Access Token not available', 'dark');
                }
            });
            this.storage.get('budgets').then((val) => {
                if (val != null) {
                    this.currencyFormat = JSON.parse(val)[0].currency_format;
                    console.log(this.currencyFormat);
                } else {
                    this.commonService.createToast('Access Token not available', 'dark');
                }
            });
        } else {
            this.getQuotas();
        }
        setTimeout(() => {
            event.target.complete();
        }, 1000);
    }

    getQuotas() {
        this.storage.get('quota').then((val) => {
            if (val != null) {
                this.getData(val);
            } else {
                this.commonService.createToast('No categories has been set', 'dark');
            }
        });
    }

    flipCard(x) {
        console.log(x)
        if (this.flipped[x.id] === 'undefined') this.flipped[x.id] = true;
        else this.flipped[x.id] = !this.flipped[x.id];
        // this.flipped = !this.flipped;
    }

    getColor(value) {
        if (value.budgeted > 0) {
            const calculatedPercentage = value.balance * 100 / value.budgeted;
            switch (true) {
                case calculatedPercentage >= 75:
                    return '#1cab22'
                    break;
                case calculatedPercentage >= 50 && calculatedPercentage < 75:
                    return '#86e01e'
                    break;
                case calculatedPercentage >= 25 && calculatedPercentage < 50:
                    return '#f2d31b'
                    break;
                case calculatedPercentage >= 10 && calculatedPercentage < 25:
                    return '#f27011'
                    break;
                case calculatedPercentage > 0 && calculatedPercentage < 10:
                    return '#f63a0f'
                    break;
            }
        }
    }

    thousandSep(val, separator) {
        const separator_edited = `$1${separator}`
        return String(val).split("").reverse().join("")
            .replace(/(\d{3}\B)/g, separator_edited)
            .split("").reverse().join("");
    }

    updateCurrency(balance) {
        let updatedCurrencyValue;
        if (this.currencyFormat.decimal_digits === 2) {
            updatedCurrencyValue = (balance / 1000).toFixed(2);
        } else if (this.currencyFormat.decimal_digits === 3) {
            updatedCurrencyValue = (balance / 1000).toFixed(3);
        } else {
            updatedCurrencyValue = Math.round(balance / 1000);
        }
        if (this.currencyFormat.display_symbol && this.currencyFormat.symbol_first) {
            updatedCurrencyValue = `${this.currencyFormat.currency_symbol}${updatedCurrencyValue}`;
        } else if (this.currencyFormat.display_symbol && !this.currencyFormat.symbol_first) {
            updatedCurrencyValue = `${updatedCurrencyValue}${this.currencyFormat.currency_symbol}`;
        }
        updatedCurrencyValue = updatedCurrencyValue.replace('.', this.currencyFormat.decimal_separator)
        updatedCurrencyValue = this.thousandSep(updatedCurrencyValue, this.currencyFormat.group_separator);
        return updatedCurrencyValue;
    }

    async getData(categoryData) {
        const details = JSON.parse(categoryData);
        const loading = await this.loadingController.create({});
        if (details.length && details[0].budget_id) {
            loading.present().then(() => {
                this.http.get(`https://api.youneedabudget.com/v1/budgets/${details[0].budget_id}/categories/`, {}, this.headers).then(data => {
                    this.budgetData = JSON.parse(data.data).data.category_groups;
                    this.quotaData = [];
                    details.forEach((val) => {
                        console.log(val);
                        var subcategoriesList = this.budgetData.filter(x => x.id === val.cat_id);
                        var categoryInformation = subcategoriesList[0].categories.filter(y => y.id === val.sub_cat_id);
                        if (categoryInformation[0].budgeted > 0) {
                            let value = categoryInformation[0].balance * 100 / categoryInformation[0].budgeted;
                            value = value < 0 ? 0 : value;
                            categoryInformation[0].width = `${value}%`;
                        }
                        categoryInformation[0].balance_edited = this.updateCurrency(categoryInformation[0].balance);
                        categoryInformation[0].budgeted_edited = this.updateCurrency(categoryInformation[0].budgeted);
                        this.quotaData.push(categoryInformation[0]);
                    })
                    this.intialLoading = false;
                    loading.dismiss();
                    // this.getCategoryTransactions(details[0].budget_id, this.quotaData);
                }).catch(error => {
                    if (error.status === 401)
                        this.commonService.createToast('Add a valid Access token', 'dark');
                    else this.commonService.createToast(error.error, 'danger');
                    loading.dismiss();
                    this.intialLoading = false;
                });
            });
        }
    }

    // This gets the transactions of the current month for each category
    async getCategoryTransactions(budgetID, categories) {
        const sinceDate = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-01`;
        const loading = await this.loadingController.create({});
        loading.present().then(() => {
            categories.forEach((category, index) => {
                this.http.get(`https://api.youneedabudget.com/v1/budgets/${budgetID}/categories/${category.id}/transactions/?since_date=${sinceDate}`, {}, this.headers).then(data => {
                    this.quotaData[index].transactions = JSON.parse(data.data).data.transactions;
                    this.quotaData[index].transactions_metaData = this.getTransactionMetaData(this.quotaData[index].transactions);
                    loading.dismiss();
                }).catch(error => {
                    if (error.status === 401)
                        this.commonService.createToast('Add a valid Access token', 'dark');
                    else this.commonService.createToast(error.error, 'danger');
                    loading.dismiss();
                });
            });
        });
    }

    getTransactionMetaData(transactions) {
        let obj = {
            'highest': {},
            'lowest': {},
            'average': {}
        }
    }

    clearTemplates() {
        this.storage.clear().then(() => {
            this.commonService.createToast('All templates have been cleared', 'dark');
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
}
