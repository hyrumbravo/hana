import { BakcEndService } from '@/bakc-end.service';
import {Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { LeaveService } from '@services/leave/leave.service';
import { ProfileService } from '@services/profile/profile.service';
import { RecruitmentService } from '@services/recruitment/recruitment.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'environments/environment';
import { CreditEarningService } from '@services/leave/credit-earning.service';
import { Modal } from 'bootstrap';
import { ProjectsService } from '@services/projects/projects.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin]
  };
  loadingOnLeave = false;
  loadingBirthday = false;
  loadingAnnouncement = false;
  loading = false;
  panelOpenState = false;
  dateToday = new Date()
  positions = []
  leaves = []
  leaveTypes = []
  jobOpenings = []
  dtOptions = {
    language: {
      search: '',
      searchPlaceholder: 'Search',
      lengthMenu: 'Show _MENU_ entries'
    },
    pageLength: 10,
    ordering: false,
    paging: true,
    dom: 'Bfrtip',
    buttons: [
      {extend: 'print', exportOptions:{ columns: 'thead th:not(.noExport)' }},
      {extend: 'copyHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
      {extend: 'csvHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
      {extend: 'excelHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
    ]
  }
  
  dtOptionsNull = {
    language: {
      search: '', // Removes the search label
      searchPlaceholder: 'Search',
      lengthMenu: '', // Hides the length menu text
      info: '' // Hides "Showing X to Y of Z entries"
    },
    pageLength: 10,
    ordering: false,
    paging: false, // Disables pagination
    dom: 't', // Only show the table, hides search bar, buttons, and pagination info
    buttons: [] // Remove all buttons
  };

  @ViewChild('deleteModal') deleteModalRef!: ElementRef;
  deleteModal!: any;
  selectedProjectIndex!: number;
  selectedProjectId!: string; // Store the Project ID
  @ViewChild('projectModal') projectModal!: ElementRef;
  modalInstance!: Modal;
  @ViewChild('pendingModal', { static: false }) pendingModal!: ElementRef;
    pendingmodalInstance!: any;


  employees: any = []
  announcements: any = [];
  currentUser:any = null;
  currentGroup:any = null;

  projects:any = [];
  pendingProjects: any[] = [];

  constructor(private ceService: CreditEarningService, private profileService: ProfileService,private recruitmentService: RecruitmentService, private toastr: ToastrService, private leaveService: LeaveService, private service: BakcEndService, private projectsService: ProjectsService, private router: Router) {

  }

  ngOnInit() {
    this.loading = true;
    this.loadingOnLeave = true;
    this.loadingBirthday = true;
    this.loadingAnnouncement = true;
    // Chain your service calls and set loading to false after everything is loaded
  Promise.all([
    this.getLeaveTypes(),
    this.getCurrentUser(),
    this.getJobOpenings(),
    this.getAnnouncements(),
    this.getPositions(),
  ]).then(() => {
    // Once all the necessary data has been fetched, set loading to false
    this.loading = false;

    this.loadProjects();

  }).catch((error) => {
    // Handle any errors that occur during the data fetching process
    this.toastr.error(error);
    this.loading = false; // Set loading to false even if there's an error
    this.loadingOnLeave = false;
    this.loadingBirthday = false;
    this.loadingAnnouncement = false;
  });
  }

  ngAfterViewInit() {
    // Initialize Bootstrap modal after view loads
    this.deleteModal = new Modal(this.deleteModalRef.nativeElement);

    if (this.pendingModal) {
      this.pendingmodalInstance = new Modal(this.pendingModal.nativeElement);
    }
  }

  loadProjects(): void {
    this.projectsService.getProjects().subscribe({
      next: (response) => {
        if (response.rows) {
          this.projects = response.rows.map((row: any) => ({
            ...row.doc,
            expanded: false, // Ensure expanded is false initially
            phases: [], // Each project has its own phases array
          }));
          
           // Filter pending projects with a deadline within the next 7 days
           this.pendingProjects = this.projects.filter((project: any) => {
            console.log("Checking project:", project.projectName, "Deadline:", project.deadline); // Debugging
          
            if (project.progress >= 100) return false; // Exclude completed projects

            if (!project.deadline) return false; // Ensure deadline exists
          
            const deadline = new Date(project.deadline.replace(/-/g, '/'));
            if (isNaN(deadline.getTime())) {
              console.error("Invalid date for project:", project.projectName, "Raw Value:", project.deadline);
              return false; // Skip invalid dates
            }
          
            const today = new Date();
            const timeDiff = deadline.getTime() - today.getTime();
            const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
          
            // console.log("Days left for", project.projectName, ":", daysLeft); // Debugging
          
            return daysLeft <= 7 && daysLeft >= 0            

            // if (daysLeft <= 7 && daysLeft >= 0) {
            //   // 🔹 Show Toastr notification for each pending project
            //   this.toastr.info(
            //     `${project.projectName} has ${daysLeft} day(s) left until completion!`,
            //     'Project Deadline',
            //     { timeOut: 3000 }
            //   );              
            //   return true;
            // }
            // return false;
          });

          // Show modal only if pending projects exist
          if (this.pendingProjects.length > 0 && this.pendingModal) {
            setTimeout(() => {
              if (this.pendingModal) {
                this.pendingmodalInstance = new Modal(this.pendingModal.nativeElement);
                console.log("Pending Projects:", this.pendingProjects);
                this.pendingmodalInstance.show();
              }
            }, 0);
          }
        }
      },
      
      error: (error) => {
        this.toastr.error('Failed to load projects', 'Error');
        console.error('Error fetching projects:', error);
      },
    });
  }

  closePendingModal() {
    if (this.pendingmodalInstance) {
      this.pendingmodalInstance.hide();
    }
  
    // Ensure Bootstrap removes the modal backdrop
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.remove();
    });
  
    // Remove 'modal-open' class from body to fix scrolling issue
    document.body.classList.remove('modal-open');
  }
  
  viewPendingProject(projectName: string) {
    if (this.projects.length === 0) {
      this.toastr.error('Project data is still loading. Please try again.', 'Error');
      return;
    }

    // Find the index of the project in the projects table
    const projectIndex = this.projects.findIndex(proj => 
      proj.projectName.trim().toLowerCase() === projectName.trim().toLowerCase()
    );
  
    if (this.projects.length === 0) {
      this.toastr.error('Project data is still loading. Please try again.', 'Error');
      return;
    }
  
    if (projectIndex !== -1) {
      // Expand the project if needed
      this.projects[projectIndex].expanded = true;
  
      // Close the pending modal before scrolling
      this.closePendingModal();
  
      const today = new Date();
      // Use the project retrieved by index
      const project = this.projects[projectIndex];  // Fix: Declare 'project' using the index
      const deadline = new Date(project.deadline.replace(/-/g, '/'));
      const timeDiff = deadline.getTime() - today.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  
      // Set a flag in sessionStorage before redirecting
      sessionStorage.setItem('redirectedFromPending', 'true');
  
      // Store the project name and days left in sessionStorage
      sessionStorage.setItem('pendingProject', JSON.stringify({ projectName, daysLeft }));
  
      this.router.navigate(['/projects'], { queryParams: { projectName: projectName } });
  
      // Use a timeout to allow Angular to update the DOM before scrolling
      setTimeout(() => {
        const projectRow = document.getElementById('project-' + projectIndex);
        if (projectRow) {
          projectRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
          // 🔹 Highlight the project row for better visibility
          projectRow.classList.add('highlight');
          setTimeout(() => projectRow.classList.remove('highlight'), 4000); // Remove highlight after 2 sec
        } else {
          this.toastr.error('Could not locate the project in the table.', 'Error');
        }
      }, 500); // Slightly longer delay ensures modal is closed before scrolling
    } else {
      this.toastr.error('Project not found', 'Error');
    }
  }

  getCurrentUser() {
    return new Promise((resolve, reject) => {
      this.service.getSystemUser().subscribe(
        (response: any) => {
          this.currentUser = response?.rows[0].doc;
          if (this.currentUser) {
            this.service.getUserGroupbyId(this.currentUser.setting_id).subscribe(
              (response: any) => {
                this.currentGroup = response?.rows[0].doc;
                resolve(response);
              },
              (error) => {
                this.toastr.error(error.error.reason);
                reject(error);
              }
            );
          } else {
            resolve(null);
          }
        },
        (error) => {
          this.toastr.error(error.error.reason);
          reject(error);
        }
      );
    });
}

  /**
   * Get Job Openings
   */
   getJobOpenings() {
      return new Promise((resolve, reject) => {
        this.recruitmentService.getJobOpenings().subscribe(
          (response: any) => {
            this.jobOpenings = response?.rows;
            this.jobOpenings.forEach(data => {
              data.doc.positionName = this.getPositionName(data.doc.position);
            });
            resolve(response);
          },
          (error) => {
            this.toastr.error(error.error.reason);
            reject(error);
          }
        );
      });
    }

  /**
   * Get Leave Approvals
   */
  getLeaveApprovals() {
    this.leaveService.getLeaveApprovals().subscribe(
      (response: any) => {
        // this.leaves = response?.rows
        console.log('API response:', response);  // Log the raw API response to inspect
        let list = response?.rows.filter(item => !(item.doc._id.includes('_design')));
        if(this.currentUser?.department != null){
          this.leaves = list.filter(item => {
            console.log('Item department:', item.doc.department);  // Log the department for each item
            return item.doc.department.includes(this.currentUser?.department);
          });
          console.log('Current user department:', this.currentUser?.department);
        } else {
          this.leaves = list;
          console.log('Current user department:', this.currentUser?.department);
          console.log('leaves:', this.leaves);
        }
        this.leaves.sort((a, b) => -1)
        console.log('sorted leaves:', this.leaves);
        
        let filteredLeaves = []
        this.leaves.forEach(data => {
          const emp = this.employees.find(x=> x.doc.id_no == data.doc.id_no);
          if(emp){
            filteredLeaves.push(data)
          }
        });
        console.log('filtered leaves:', filteredLeaves);

        this.leaves = filteredLeaves
        this.leaves = this.leaves.filter(data => {
          // Convert the string "YYYY-MM-DD" into Date objects
          const startDate = new Date(`${data.doc.startDateTime}T00:00:00`); // Explicitly set time to avoid time zone issues
          const finishDate = new Date(`${data.doc.finishDateTime}T23:59:59`); // Include the entire day by setting end time to 23:59:59
          console.log("date time:", startDate, " ", finishDate)
          console.log("date today:", this.dateToday)
        
          // Check if today falls within the start and finish dates and if the status is approved
          if (startDate <= this.dateToday && this.dateToday <= finishDate && data.doc.status === 'approved') {
            return data;
          }
        });
        console.log("leaves:", this.leaves)
        this.leaves.forEach(data => {
          data.doc.employeeName = this.getEmployeeName(data.doc.id_no)
          // data.doc.branch = this.getEmployeeBranch(data.doc.id_no)
          data.doc.leaveName = this.getLeaveTypeName(data.doc.leaveType)
        });
        this.loadingOnLeave = false;
        console.log("leaves:", this.leaves)
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }


  /**
   * Get Employee Name
   * @param id
   * @returns
   */
  getEmployeeName(id) {
    for (let index = 0; index < this.employees?.length; index++) {
      if (this.employees[index].doc.id_no == id) {
        return this.employees[index].doc.firstName + ' ' + this.employees[index].doc.middleName + ' ' + this.employees[index].doc.lastName + ' ' + ((this.employees[index].doc.ext)?this.employees[index].doc.ext:'')
      }
    }
  }

  /**
   * Get Positions
   */
  getPositions() {
    return new Promise((resolve, reject) => {
      this.profileService.getPositions().subscribe(
        (response: any) => {
          this.positions = response?.rows;
          this.getEmployees();  // Chain the call to get employees after positions
          resolve(response);
        },
        (error) => {
          this.toastr.error(error.error.reason);
          reject(error);
        }
      );
    });
  }

  /**
   * Get Employees and get first data
   */
  getEmployees() {
    this.profileService.getEmployees().subscribe(
      (response: any) => {
        let list = response?.rows.filter(item => !(item.doc._id.includes('_design')));

        if(this.currentUser?.department != null){
          this.employees = list.filter(item => (item.doc.serviceInformation?.department?.includes(this.currentUser?.department)));
        } else {
          this.employees = list
        }
        this.employees.forEach(data => {
          data.doc.positionTitle = this.getPositionName(data.doc.serviceInformation?.position)
        });
        
        this.getLeaveApprovals();
        this.loadingBirthday = false;
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  /**
   * Get Position Name
   */
  getPositionName(id) {
    for (let index = 0; index < this.positions?.length; index++) {
      if (this.positions[index].doc.position_name == id) {
        return this.positions[index].doc.position_name
      }
    }
  }

  /**
   * Get Announcements
   */
  getAnnouncements() {
    return new Promise((resolve, reject) => {
      this.service.announcementsList().subscribe(
        (response: any) => {
          this.announcements = response?.rows;
          this.announcements.sort((a, b) => {
            const dateA = new Date(a.doc.createdAt).getTime();
            const dateB = new Date(b.doc.createdAt).getTime();
            return dateB - dateA;  // Sort in descending order
          });
          resolve(response);
          this.loadingAnnouncement = false;
        },
        (error) => {
          this.toastr.error(error.error.reason);
          reject(error);
        }
      );
    });
  }

    /**
   * Get Leave Types
   */
    getLeaveTypes() {
      return new Promise((resolve, reject) => {
        this.leaveService.getLeaveTypes().subscribe(
          (response: any) => {
            this.leaveTypes = response?.rows;
            resolve(response);
          },
          (error) => {
            this.toastr.error(error.error.reason);
            reject(error);
          }
        );
      });
    }


    leaveDetails(l){
      if(l.leaveType == '001' || l.leaveType == '006') return `${l.leaveLocation}, ${l.leaveLocationDetail}`
      if(l.leaveType == '003') return `${l.sickLeaveLocation}, ${l.sickLeaveDetail}`
      if(l.leaveType == '011') return `${l.splBenefitsForWomenDetail}`
      if(l.leaveType == '008') return `${l.studyLeaveDetail == 'completion'? "Completion of Master's Degree":"BAR/Board Examination Review"}`
      if(l.leaveType == 'others') return `${l.otherPurpose}, ${l.others}`
  
      return 'N/A'
    }

    getLeaveTypeName(id) {
      for (let index = 0; index < this.leaveTypes?.length; index++) {
        if (this.leaveTypes[index].doc.code == id) {
          return this.leaveTypes[index].doc.leave_name
        }
      }
      return null;
    }
}
