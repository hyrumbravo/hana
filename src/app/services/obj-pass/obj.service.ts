import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ObjService {
  sharedData: any;
  private profilePic = new BehaviorSubject<any>('assets/img/default-profile.png');

  constructor() { }

  // Expose the observable stream to consumers
  get sharedMessage$(): Observable<string> {
    return this.profilePic.asObservable();
  }

  // Update the value of the BehaviorSubject
  updateMessage(message: string) {
    this.profilePic.next(message);
  }

  
}
