import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage';
import { NavController, ActionSheetController } from '@ionic/angular';
import { CommonService } from '../services/common.service';
import { ActivatedRoute } from '@angular/router';

let headers: any;

@Component({
    selector: 'app-tab2',
    templateUrl: 'tab2.page.html',
    styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit {

    private templates: any[];
    public availableCategories: any = [];
    accessTokenAvailable: boolean = false;;

    constructor(private storage: Storage,
        private commonService: CommonService,
        public navCtrl: NavController,
        public actionSheetController: ActionSheetController,
        route:ActivatedRoute) {
        route.params.subscribe(val => {
            if (this.commonService.refreshRequired.categoriesPage) {
                this.updateAvailableCategories(null);
                this.commonService.refreshRequired.categoriesPage = false;
            }
            if(this.commonService.acessTokenRefreshRequired.categoriesPage){
                this.ngOnInit();
            }
        });
    }

    deleteTemplate(item) {
        this.availableCategories = this.availableCategories.filter(x => x.name !== item.name);
        this.storage.set('quota', JSON.stringify(this.availableCategories));
        this.commonService.createToast('Category removed from list', 'dark');
    }

    doRefresh(event) {
        this.updateAvailableCategories(event);
    }

    async presentActionSheet(data) {
        const actionSheet = await this.actionSheetController.create({
            buttons: [{
                text: 'Edit',
                role: 'destructive',
                icon: 'create',
                handler: () => {
                    this.commonService.createToast('Edit function - Coming soon!', 'dark');
                }
            }, {
                text: 'Delete',
                role: 'destructive',
                icon: 'trash',
                handler: () => {
                    this.deleteTemplate(data);
                }
            }]
        });
        await actionSheet.present();
    }

    ngOnInit() {
        this.storage.get('apiToken').then((val) => {
            if (val === null) {
                this.commonService.createToast('Access token not available', 'dark');
            } else {
                this.accessTokenAvailable = true;
            }
        });
        this.updateAvailableCategories(null);
    }

    addCategory() {
        this.navCtrl.navigateForward('/select-message');
    }

    updateAvailableCategories(e) {
        this.storage.get('quota').then((val) => {
            if (e) {
                e.target.complete();
            }
            if (val != null) {
                this.availableCategories = JSON.parse(val);
            }
        });
    }

}


