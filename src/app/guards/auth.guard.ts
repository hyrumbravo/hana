import {Injectable} from '@angular/core';
import {
    CanActivate,
    CanActivateChild,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    UrlTree,
    Router
} from '@angular/router';
import {Observable, map} from 'rxjs';
import {AppService} from '@services/app.service';
import { BakcEndService } from '@/bakc-end.service';
import { ToastrService } from 'ngx-toastr';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
    constructor(private router: Router, private appService: AppService, private backendService:BakcEndService, private toastr:ToastrService) {}

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ):
        | Observable<boolean | UrlTree>
        | Promise<boolean | UrlTree>
        | boolean
        | UrlTree {
        const requiredPermission = next.data.requiredPermission

        if(localStorage.getItem('settings') && this.checkPermissions()){
            console.log('?')
            this.backendService.getUserGroupbyId(localStorage.getItem('settings')).subscribe( data1 =>{
                if(data1['rows'].length != 0){
                    if(data1['rows'][0].doc.inactive != 0){
                        this.toastr.warning('User Role Inactive. Permission Denied.')
                        console.log('[AUTH]: ' + data1['rows'][0].doc.group_name + ' role inactive. Permission Denied.')
                        this.router.navigate(['/']);
                    }
                    
                   const permissions = data1['rows'][0].doc.permissions
                   if (requiredPermission && !permissions[requiredPermission]) {
                    console.log('[AUTH]: user has no access to ' + requiredPermission + ' module. Redirecting...')
                    this.router.navigate(['/']);
                   }
                } else this.appService.GetUserPermissions();
            });
        } else this.appService.GetUserPermissions()

        return this.getProfile();
    }

    canActivateChild(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ):
        | Observable<boolean | UrlTree>
        | Promise<boolean | UrlTree>
        | boolean
        | UrlTree {
        return this.canActivate(next, state);
    }

    async getProfile() {
        if (this.appService.user) {
            return true;
        }

        try {
            await this.appService.getProfile();
            return true;
        } catch (error) {
           return false;
        }
    }

     checkPermissions(){
        if (!localStorage.getItem('userID')) {
            return false;
        } return true

    }
}
