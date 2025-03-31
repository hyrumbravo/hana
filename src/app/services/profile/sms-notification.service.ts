import { smsSettings } from '@/utils/sms';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ProfileService } from './profile.service';
import { LeaveService } from '@services/leave/leave.service';
import { map } from 'rxjs';
import { BakcEndService } from '@/bakc-end.service';

@Injectable({
  providedIn: 'root'
})
export class SmsNotificationService {
  users:any = [];
  userGroups: any = [];
  receipients:any = [];
  leaveTypes:any = [];
  deptHeadKeywords = ["city government department head i", "department head", 'dept head', "cgdh", "cgdh-i"]
  divChiefKeywords = ["division chief", 'div chief']
  mayorChiefKeywords = ["mayor", 'city mayor']
  approvalRequirement = {
    certification: true,
    divchief: false,
    depthead: false,
    mayor: false
  }

  constructor(
    private http: HttpClient, 
    private profileService: ProfileService,
    private leaveService:LeaveService,
    private backService: BakcEndService
  ) { }

  async notify(leaveInfo:any){
    if(leaveInfo && leaveInfo?.approverA == null){
      await this.getAllUsers();
      if(this.users.length != 0){
        await this.identifySenders(leaveInfo)
      }
    }
  }

 private async getAllUsers(){
  return new Promise<void>((resolve, reject) => {
    this.profileService.getUser()
      .pipe(map((data: any) => {
          const prunedUsers = data.rows.filter(item => (
            'doc' in item &&
            'smsNotification' in item.doc &&
            item.doc.smsNotification == true &&
            item.doc.smsSetting?.isEnabled == true && item.doc.smsSetting?.isVerified == true
          ));
          return { ...data, rows: prunedUsers };
        })
      ).subscribe(
        async (data: any) => {
          await this.getLeaveTypes();
          await this.getAllGroups();
          this.users = data.rows;
          resolve();
        },
        error => {
          reject(error);
        }
      );
  });
 }

 private async getAllGroups(){
  return new Promise<void>((resolve, reject) => {
    this.backService.users().subscribe((data:any) => {
      this.userGroups = data.rows;
      resolve();
    }),
    (error) => {
      reject(error);
    };
  })
 
 }

  getLeaveTypes() {
    return new Promise<void>((resolve, reject) => {
      this.leaveService.getLeaveTypes().subscribe(
        (response: any) => {
          this.leaveTypes = response?.rows
          resolve();
        },
        (error) => {
          reject(error);
        }
      )
    })
    
  }

  private getLeaveTypeName(id:string) {
      if(id === null){
        return null
      }
  
      for (let index = 0; index < this.leaveTypes?.length; index++) {
        if (this.leaveTypes[index].doc.code === id) {
          return this.leaveTypes[index].doc.leave_name
        }
      }
  }

 private async broadcastSMS(user, leaveInfo, action){
    //send broadcast type 
    const message = this.constructMessage(leaveInfo, action)
    const payload = {
      'app_key': smsSettings.M360_APP_KEY,
      'app_secret': smsSettings.M360_APP_SECRET,
      'msisdn': user.smsSetting.phoneNumber,
      'shortcode_mask': smsSettings.shortcode_mask,
      'content': message,
      'is_intl': false,
    };
    this.http.post(smsSettings.urlBroadcast, payload).subscribe(
      async (response: any) => {
        if(response.code == 201){
          console.log('SMS Broacast sent.')
        } else {
          await this.updateUserFailed(user)
        }
        },
        (error) => {
          throw Error(error.error.reason)
        }
      )
  }

  async updateUserFailed(user){
    user.smsSetting.isVerified = false;
    user.smsSetting.lastFailedSmsSent = new Date();

    await this.profileService.updateUser(user).subscribe(
      (response: any) => {
        if(response.ok){
          this.getAllUsers()
        }
      },
      (error) => {
        throw Error(error.error.reason)
      }
    )
  }

  private constructMessage(leaveInfo:any, action: string):string{
    return`[ID No. ${leaveInfo.id_no}] Employee ${leaveInfo.empFirstName ?? ''} ${leaveInfo.empLastName ?? ''} filed a ${this.getLeaveTypeName(leaveInfo.leaveType) ?? 'leave'} for ${leaveInfo.totalDays} ${leaveInfo.totalDays != 1? 'days':'day'} ${formatDate(leaveInfo)} waiting ${action ?? 'for checking'}. Please check HANA for more details. Leave Application Date: ${formatFiledDate(leaveInfo.dateFiled)} w/ Reference #${leaveInfo.referenceNumber}.`;
  }

  private identifySenders(leaveInfo){
    let approvers = []
    const position = leaveInfo.position_title.toLowerCase()

    if(this.isEmployeeDeptHead(position)){
      if(leaveInfo.approverC == null){
       approvers = this.users.filter(x=> this.mayorChiefKeywords.includes(x.doc.designation.toLowerCase()))
      }
    } else if(this.isEmployeeDivisionChief(position)) {
      if(leaveInfo.approverC == null){
        approvers = this.users.filter(x=> this.deptHeadKeywords.includes(x.doc.designation.toLowerCase()) && 
          (x.doc.department.toLowerCase() === leaveInfo.department.toLowerCase())  )
      }
    } else { //employee
      if(leaveInfo.approverB == null){
        approvers = this.users.filter(x=> this.divChiefKeywords.includes(x.doc.designation.toLowerCase()) && 
            (x.doc.department.toLowerCase() === leaveInfo.department.toLowerCase())  )
      } else if (leaveInfo.approverB != null && leaveInfo.approverC == null){
        approvers = this.users.filter(x=> this.deptHeadKeywords.includes(x.doc.designation.toLowerCase()) && 
          (x.doc.department.toLowerCase() === leaveInfo.department.toLowerCase())  )
      }

      this.addRecipient(approvers, leaveInfo, 'for approval')
    }

    if(leaveInfo.approverC != null){ //to certify
      const officeHeads = this.getGroupId('Office Heads')

      const approvers = this.users.filter(x=> x.doc.setting_id != officeHeads.id)
      this.addRecipient(approvers, leaveInfo, 'to certify')
    }

  }

  addRecipient(approvers, leaveInfo, action){
    if(approvers){
      approvers.forEach(el => {
        this.broadcastSMS(el.doc, leaveInfo, action)
      });
    }
  }

  isEmployeeDivisionChief(position) {
    return this.divChiefKeywords.includes(position.toLowerCase());
  }
  
  isEmployeeDeptHead(position) {
    return this.deptHeadKeywords.includes(position.toLowerCase())
  }
  
  isEmployeeMayor(position) {
    return this.mayorChiefKeywords.includes(position.toLowerCase())
  }

  getGroupId(group_name){
    return this.userGroups.find(x=>x.doc.group_name.toLowerCase() == group_name.toLowerCase())
}

}

// Define a helper function to format the date
function formatDate(leave: any ): string {
  const from = new Date(leave.startDateTime);

  const month = (from.getMonth() + 1).toString().padStart(2, '0');
  const day = from.getDate().toString().padStart(2, '0');
  const year = from.getFullYear().toString();

  const newFrom = `${month}-${day}-${year}`;

  const to = new Date(leave.finishDateTime);
  const month1 = (to.getMonth() + 1).toString().padStart(2, '0');
  const day1 = to.getDate().toString().padStart(2, '0');
  const year1 = to.getFullYear().toString();

  const newTo = `${month1}-${day1}-${year1}`;
 

  return newTo === newFrom? `this ${month}-${day}-${year}`:
  `from ${month}-${day}-${year} to ${month1}-${day1}-${year1}`;
}

function formatFiledDate(dateString: string){
  const date = new Date(dateString);

  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear().toString();

  return `${month}-${day}-${year}`;
}