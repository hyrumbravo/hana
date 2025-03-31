import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { AppService } from '@services/app.service';
import { of, Observable,  throwError } from 'rxjs';
import { shareReplay, tap, catchError, map } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import moment from 'moment'; 

@Injectable({
  providedIn: 'root'
})
export class TimelogsService {
  headers = new HttpHeaders()
    .set('Authorization', `Basic ${btoa('admin:h@n@')}`)
    .set('Content-Type', 'application/json');

  private apiUrl = environment.globalUrl + '/timelogs'; // Base URL for timelogsDb

  userId: string | null = null;
  idNo: string = '';
  userName: string;
  designation: string;
  
  constructor(
    private appService: AppService,
    private http: HttpClient,
    private toastr: ToastrService
  ) {}

  getTimelogs(): Observable<any> {
    return this.http.get(this.apiUrl + environment.apiIncludeDocs, { headers: this.headers }).pipe(
      map((response: any) => {
        response.rows = response.rows.reverse();
        return response;
      }),
      shareReplay(1)
    );
  }  
  
  getTimelogById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`, { headers: this.headers }).pipe(shareReplay(1));
  }

  // Create a new time log
  createTimelog(payload: any): Observable<any> {
    return this.http.post(this.apiUrl, payload, { headers: this.headers });
  }

  // Update an existing time log
  updateTimelog(id: string, payload: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, payload, { headers: this.headers });
  }

  // Delete timelog by `_id` and `_rev`
  deleteTimelog(id: string, rev: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}?rev=${rev}`, { headers: this.headers });
  }

  getEmployeeById(id: string): Observable<any> {
    const mangoQuery = {
      selector: {
        id_no: id
      },
    };
    return this.http.post(environment.globalUrl + '/employees/_find', mangoQuery, { headers: this.headers }).pipe(shareReplay(1));
  }

  getTimelogByEmployeeIdAndDate(employeeId: string, date: string): Observable<any> {
    const mangoQuery = {
      selector: {
        employee_id: employeeId,
        date: date, // Filter by the current date
        timeIn: { "$exists": true }, // checks time-in log
      },
    };
    return this.http.post(environment.globalUrl + '/timelogs/_find', mangoQuery, { headers: this.headers })
      .pipe(
        map((response: any) => response.docs[response.docs.length-1]), // Return the last matching docs
        shareReplay(1)
      );
  }

  loadUserDetails(): Observable<any> {
    this.userId = this.appService.user || localStorage.getItem('userID');
    if (this.userId) {
      return this.appService.getUserDetailsById(this.userId).pipe(
        map((response) => {
          const middleName = response.middleName && response.middleName.trim() !== ''
          ? `${response.middleName.charAt(0).toUpperCase()}.`
          : '';
          this.userName = `${response.firstName}${middleName ? ` ${middleName}` : ''} ${response.lastName}`.replace(/\s+/g, ' ').trim();
          this.designation = response.designation;
          return {
            id_no: response.id_no,
            userName: this.userName,
            designation: this.designation,
          };
        })
      );
    } else {
      this.toastr.error('User ID not found. Please log in.');
      return of(null);  
    }
  }

  calculateSelectedEmployeesWorkHours(idNo: string, allRequests: any[]): { [date: string]: number } {
    const workHoursByDate: { [date: string]: number } = {};
    allRequests.forEach(request => {

      if (request.doc.employee_id === idNo) {
        const timeIn = request.doc.timeIn;
        const timeOut = request.doc.timeOut;
        const date = request.doc.date;

        if (timeIn && timeOut && date) {
          const workHours = this.calculateWorkHoursInHours(timeIn, timeOut);
          if (workHoursByDate[date]) {
            workHoursByDate[date] += workHours;
          } else {
            workHoursByDate[date] = workHours;
          }
        }
      }
    });
    return workHoursByDate;
  }

  calculateAllEmployeesWorkHours(allRequests: any[]): { [employeeId: string]: { [date: string]: number } } {
    const workHoursByEmployee: { [employeeId: string]: { [date: string]: number } } = {};
  
    allRequests.forEach(request => {
      const employeeId = request.doc.employee_id;
      const timeIn = request.doc.timeIn;
      const timeOut = request.doc.timeOut;
      const date = request.doc.date;
      const overtimeHours = request.doc.overtimeRequest?.overtime ? parseFloat(request.doc.overtimeRequest.overtime) : 0; // Get overtime hours as a number
  
      if (employeeId && timeIn && timeOut && date) {
        let workHours = this.calculateWorkHoursInHours(timeIn, timeOut);
        workHours = Math.max(workHours - overtimeHours, 0);
  
        if (!workHoursByEmployee[employeeId]) {
          workHoursByEmployee[employeeId] = {};
        }
  
        if (workHoursByEmployee[employeeId][date]) {
          workHoursByEmployee[employeeId][date] += workHours;
        } else {
          workHoursByEmployee[employeeId][date] = workHours;
        }
      }
    });
    return workHoursByEmployee;
  }

  calculateWorkHoursInHours(timeIn: string, timeOut: string): number {
    const startTime = moment(timeIn, 'hh:mm A');
    const endTime = moment(timeOut, 'hh:mm A');
    const workDuration = moment.duration(endTime.diff(startTime));
    return workDuration.asHours(); // Return hours as a decimal
  }

  isLate(timeIn: string): boolean {
    const timeInMoment = moment(timeIn, 'hh:mm A');
    const morningThreshold = moment('08:01 AM', 'hh:mm A');
    const afternoonThreshold = moment('01:01 PM', 'hh:mm A');
  
    if (timeInMoment.isBefore(moment('12:00 PM', 'hh:mm A'))) {
      return timeInMoment.isSameOrAfter(morningThreshold);
    } else {
      return timeInMoment.isSameOrAfter(afternoonThreshold);
    }
  }

  noTimeOut(timeInDate: string, timeOut: string | null | undefined): boolean {
    if (timeOut) {
      return false;
    }
    const currentDate = moment().format('YYYY-MM-DD'); // Today's date
    const timeInMoment = moment(timeInDate, 'YYYY-MM-DD'); // Convert time-in date to a moment object
    return timeInMoment.isBefore(currentDate, 'day');
  }
}