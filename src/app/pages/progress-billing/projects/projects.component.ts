import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import 'datatables.net-buttons/js/buttons.html5.js';
import 'datatables.net-buttons/js/buttons.print.js';
import { Modal } from 'bootstrap';
import { ProjectsService } from '@services/projects/projects.service';
import { forkJoin } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { NgModel,  } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss']
})
export class ProjectsComponent implements OnInit {

  @ViewChild('projectNameRef') projectNameRef!: ElementRef;
  @ViewChild('projectDescriptionRef') projectDescriptionRef!: ElementRef;
  @ViewChild('clientNameRef') clientNameRef!: ElementRef;
  @ViewChild('startDateRef') startDateRef!: ElementRef;
  @ViewChild('deadlineRef') deadlineRef!: ElementRef;
  @ViewChild('totalAmountRef') totalAmountRef!: ElementRef;
  @ViewChild('downPaymentRef') downPaymentRef!: ElementRef;

  @ViewChild('projectNameModel') projectNameModel: NgModel;
  @ViewChild('projectDescriptionModel') projectDescriptionModel: NgModel;
  @ViewChild('clientNameModel') clientNameModel: NgModel;
  @ViewChild('startDateModel') startDateModel: NgModel;
  @ViewChild('deadlineModel') deadlineModel: NgModel;
  @ViewChild('totalAmountModel') totalAmountModel: NgModel;
  @ViewChild('downPaymentModel') downPaymentModel: NgModel;

  @ViewChild('deleteModal') deleteModalRef!: ElementRef;
  deleteModal!: any;
  selectedProjectIndex!: number;
  selectedProjectId!: string; // Store the Project ID

  @ViewChild('projectModal') projectModal!: ElementRef;
  modalInstance!: Modal;

  @ViewChild('AddPhaseModal') AddPhaseModal!: ElementRef;
  phaseModalInstance!: Modal;

  @ViewChild('pendingModal', { static: false }) pendingModal!: ElementRef;
  pendingmodalInstance!: any;



  totalPhasePercentage: number = 0; // Tracks total percentage used
  
  // Projects array for display
  projects:any = [];

  searchTerm: string = '';

  pendingProjects: any[] = [];
  
  newProject: any = {
    projectName: '',
    projectDescription: '',
    clientName: '',
    startDate: '',
    deadline: '',
    totalAmount: null,
    downPayment: 0,
    progress: 0, // Default progress value

  };

  // phase array for display
  phases:any = [];
  
  loading = false; // Flag for showing a loading spinner
  
  
  highlightedProjectIds: string[] = [];
  showHighlightInfoOnce: boolean = false;
  highlightCount: number = 0;
  
  constructor(private toastr: ToastrService, private projectsService: ProjectsService, private router: Router, private route: ActivatedRoute, private cdRef: ChangeDetectorRef) {}

  get filteredProjects() {
    return this.projects.filter(project =>
      project.projectName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      project.clientName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      project.projectId.toString().includes(this.searchTerm.toLowerCase())
    );
  }

  highlightProjectOnClick(projectId: string): void {
    // Set the project ID to sessionStorage when clicked
    sessionStorage.setItem('highlightedProjectId', projectId);
  
    // Call the highlight function
    this.highlightProject(projectId);
  }

  ngOnInit(): void {
    // Load sort order from localStorage (default to descending)
    const savedOrder = localStorage.getItem('projectSortOrder');
    this.isDescending = savedOrder !== 'asc';
  
    this.route.queryParams.subscribe(params => {
      const projectId = params['projectId'];
      const storedProject = sessionStorage.getItem('pendingProject');
      const storedPending = sessionStorage.getItem('highlightPendingProjects');
      const storedHighlight = sessionStorage.getItem('highlightCompletedProjects');
      const showOnce = sessionStorage.getItem('showHighlightInfoOnce') === 'true';
      const storedOverdue = sessionStorage.getItem('highlightOverdueProjects');
      const highlightedProjectId = sessionStorage.getItem('highlightedProjectId');

      
      if (projectId) {
        this.highlightedProjectIds = []; // ✅ Clear before loading projects to prevent multi-highlight
      }
      
      this.loadProjects(() => {
        if (projectId) {
          this.highlightProject(projectId);
          this.clearQueryParams();
        } else if (this.highlightedProjectIds.length > 0) {
          this.highlightMultipleProjects(this.highlightedProjectIds);
          this.clearQueryParams();
          return;
        }
        
        
        if (storedProject) {
          const { projectId: storedCustomId, daysLeft } = JSON.parse(storedProject);

          const matchedProject = this.projects.find(
            p => p._id?.toString() === projectId || p.projectId?.toString() === storedCustomId
          );

          if (matchedProject) {
            if (daysLeft === 0) {
              this.toastr.info(`Today is the due date for project ${matchedProject.projectName}!`, 'Project Deadline', { timeOut: 1800 });
            } else {
              this.toastr.info(`Project ${matchedProject.projectName} has ${daysLeft} day(s) left until completion!`, 'Project Deadline', { timeOut: 1800 });
            }
          }

          sessionStorage.removeItem('pendingProject');
        }
  
        if (highlightedProjectId) {
          // Highlight the project if it exists in sessionStorage
          this.highlightProject(highlightedProjectId);
        }
      
        // Clear the sessionStorage on page load to remove any lingering highlight info
        sessionStorage.removeItem('highlightedProjectId');
      
        if (storedHighlight && showOnce) {
          this.highlightedProjectIds = JSON.parse(storedHighlight);
          this.showHighlightInfoOnce = true;
        }

        if (showOnce) {
          if (storedHighlight) {
            this.highlightedProjectIds = JSON.parse(storedHighlight);
            sessionStorage.removeItem('highlightCompletedProjects');
          } else if (storedPending) {
            this.highlightedProjectIds = JSON.parse(storedPending);
            sessionStorage.removeItem('highlightPendingProjects');
          } else if (storedOverdue) {
            this.highlightedProjectIds = JSON.parse(storedOverdue);
            sessionStorage.removeItem('highlightOverdueProjects');
          }
        
          if (this.highlightedProjectIds.length > 0) {
            this.showHighlightInfoOnce = true;
        
            this.highlightCount = this.projects.filter(p =>
              this.highlightedProjectIds.includes(p.projectId)
            ).length;
        
            this.highlightMultipleProjects(this.highlightedProjectIds);
            this.clearQueryParams();

          }
        
          sessionStorage.removeItem('showHighlightInfoOnce');
        }
        
      });
    });
  }
  
  applyHighlights(): void {
    if (this.highlightedProjectIds.length > 0) {
      this.projects.forEach((project) => {
        if (this.highlightedProjectIds.includes(project.projectName)) {
          // Add a class or property to highlight the project
          project.highlighted = true;
        }
      });
    }
  }
    

  modalElement: HTMLElement;
  ngAfterViewInit() {

    // Initialize Bootstrap modal after view loads
    this.deleteModal = new Modal(this.deleteModalRef.nativeElement);
  }

  clearQueryParams() {
    this.router.navigate([], {
        queryParams: {},
        queryParamsHandling: 'merge', // Remove projectName while keeping other params
    });
} 


  isLoadingProjects = true;

  loadProjects(callback?: () => void): void {
    this.isLoadingProjects = true; // Start loading

    this.projectsService.getProjects().subscribe({
        next: (response) => {
            if (response.rows) {
                // Map the projects and sort them by projectId
                this.projects = response.rows.map((row: any) => ({
                    ...row.doc,
                    expanded: false, // Ensure expanded is false initially
                    phases: [], // Each project has its own phases array
                    
                }));

                // Sort projects based on the current sort order (ascending/descending)
                this.sortProjects();

                if (callback) {
                    callback(); // Run the callback after projects have loaded
                }

                // Call this before clearing sessionStorage
                if (this.showHighlightInfoOnce && this.highlightedProjectIds.length > 0) {
                  this.highlightCount = this.projects.filter(p =>
                    this.highlightedProjectIds.includes(p.projectId)
                  ).length;

                  // 👇 Scroll and highlight here
                  this.highlightMultipleProjects(this.highlightedProjectIds);
                }

                // Clear after highlighting
                if (this.showHighlightInfoOnce) {
                  sessionStorage.removeItem('highlightCompletedProjects');
                  sessionStorage.removeItem('showHighlightInfoOnce');
                }
            }
            this.isLoadingProjects = false; // ✅ Stop loading after success

        },
        error: (error) => {
            this.toastr.error('Failed to load projects', 'Error');
            console.error('Error fetching projects:', error);
            this.isLoadingProjects = false; // ✅ Stop loading even if there's an error

        },
    });
  }


  isDescending: boolean = true;

  // sortColumn: '' | 'projectName' | 'clientName' = '';
  sortColumn: '' | 'projectName' | 'clientName' | 'startDate' | 'deadline' = '';


  sortDirection: '' | 'asc' | 'desc' = '';
  

  // sortByProjectName(): void {
  //   if (this.sortDirection === '') {
  //     this.sortDirection = 'asc';
  //   } else if (this.sortDirection === 'asc') {
  //     this.sortDirection = 'desc';
  //   } else {
  //     this.sortDirection = '';
  //   }

  //   this.applySorting();
  // }

  // sortByColumn(column: 'projectName' | 'clientName'): void {
  //   if (this.sortColumn === column) {
  //     // Toggle sort direction
  //     this.sortDirection = this.sortDirection === 'asc' ? 'desc' : (this.sortDirection === 'desc' ? '' : 'asc');
  //   } else {
  //     // Set new column and default to ascending
  //     this.sortColumn = column;
  //     this.sortDirection = 'asc';
  //   }
  
  //   this.applySorting();
  // }


  // sortByColumn(column: 'projectName' | 'clientName' | 'startDate'): void {
  //   if (this.sortColumn === column) {
  //     this.sortDirection = this.sortDirection === 'asc' ? 'desc' : (this.sortDirection === 'desc' ? '' : 'asc');
  //   } else {
  //     this.sortColumn = column;
  //     this.sortDirection = 'asc';
  //   }
  
  //   this.applySorting();
  // }

  sortByColumn(column: 'projectName' | 'clientName' | 'startDate' | 'deadline'): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : (this.sortDirection === 'desc' ? '' : 'asc');
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  
    this.applySorting();
  }
  
  // toggleSort() {
  //   this.isDescending = !this.isDescending;
  //   localStorage.setItem('projectSortOrder', this.isDescending ? 'desc' : 'asc');
  //   this.sortProjects();
  // }

  toggleSort(): void {
    // Toggle between asc → desc → null (unsorted)
    if (this.sortDirection === null) {
      this.sortDirection = 'asc';
    } else if (this.sortDirection === 'asc') {
      this.sortDirection = 'desc';
    } else {
      this.sortDirection = null;
    }
  
    this.applySorting();
  }

  //without loading page but unsorting is not working
  // applySorting(): void {
  //   let sortedProjects = [...this.projects];
  
  //   if (this.sortDirection === 'asc') {
  //     sortedProjects.sort((a, b) => {
  //       if (this.sortColumn === 'startDate' || this.sortColumn === 'deadline') {
  //         return new Date(a[this.sortColumn]).getTime() - new Date(b[this.sortColumn]).getTime();
  //       }
  //       return a[this.sortColumn].localeCompare(b[this.sortColumn]);
  //     });
  //   } else if (this.sortDirection === 'desc') {
  //     sortedProjects.sort((a, b) => {
  //       if (this.sortColumn === 'startDate' || this.sortColumn === 'deadline') {
  //         return new Date(b[this.sortColumn]).getTime() - new Date(a[this.sortColumn]).getTime();
  //       }
  //       return b[this.sortColumn].localeCompare(a[this.sortColumn]);
  //     });
  //   }
  
  //   this.projects = sortedProjects;
  // }

  applySorting(): void {
    if (this.sortDirection === '') {
      this.loadProjects(); // Or set this.projects = [...this.originalProjects];
      return;
    }
  
    let sortedProjects = [...this.projects];
  
    sortedProjects.sort((a, b) => {
      const col = this.sortColumn;
  
      if (col === 'startDate' || col === 'deadline') {
        const dateA = new Date(a[col]).getTime();
        const dateB = new Date(b[col]).getTime();
        return this.sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
  
      const compare = a[col].localeCompare(b[col]);
      return this.sortDirection === 'asc' ? compare : -compare;
    });
  
    this.projects = sortedProjects;
  }
  
  sortProjects() {
    if (this.isDescending) {
        this.projects.sort((a, b) => b.projectId - a.projectId); // Descending order
    } else {
        this.projects.sort((a, b) => a.projectId - b.projectId); // Ascending order
    }
  }

  isHighlighted: boolean = false; // Add this property to track highlighting


  
  highlightProject(projectId: string) {
    // Remove previously stored highlight info from sessionStorage to reset
    sessionStorage.removeItem('highlightCompletedProjects');
    sessionStorage.removeItem('highlightPendingProjects');
    sessionStorage.removeItem('highlightOverdueProjects');
    sessionStorage.removeItem('showHighlightInfoOnce');
    
    // Clear any existing highlights immediately
    document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
  
    // Check if the projectId has already been highlighted
    if (sessionStorage.getItem('highlightedProject') === projectId) {
      return; // If the project has been highlighted before, do nothing
    }
  
    // Store the current projectId in sessionStorage to prevent repeated highlights
    sessionStorage.setItem('highlightedProject', projectId);
  
    // Make sure change detection runs before checking for DOM elements
    this.cdRef.detectChanges();
  
    setTimeout(() => {
      requestAnimationFrame(() => {
        const projectRow = document.getElementById('project-' + projectId);
        if (projectRow) {
          projectRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
          projectRow.classList.add('highlight');
          setTimeout(() => projectRow.classList.remove('highlight'), 3000);
        } else {
          console.warn('Could not find row for projectId:', projectId);
        }
      });
    }, 100);
  }
  

  private highlightRowTemporarily(element: HTMLElement, duration: number = 10000): void {
    console.log('Applying highlight to:', element.id); // 👈 Debug
    element.classList.add('highlight');
    void element.offsetWidth;
    setTimeout(() => element.classList.remove('highlight'), duration);
  }
  
  highlightMultipleProjects(projectIds: string[]): void {
    let found = false;
    let firstScrolled = false;
  
    sessionStorage.removeItem('highlightedProject');
  
    setTimeout(() => {
      projectIds.forEach(id => {
        const project = this.projects.find(p => p.projectId === id);
  
        if (project) {
          found = true;
          const el = document.getElementById(`project-${project.projectId}`);
  
          if (el) {
            if (!firstScrolled) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.focus({ preventScroll: true });
              firstScrolled = true;
            }
  
            this.highlightRowTemporarily(el);
  
            if (!this.highlightedProjectIds.includes(project.projectId)) {
              this.highlightedProjectIds.push(project.projectId);
            }
  
            this.cdRef.detectChanges();
  
            setTimeout(() => {
              const idx = this.highlightedProjectIds.indexOf(project.projectId);
              if (idx !== -1) {
                this.highlightedProjectIds.splice(idx, 1);
                this.cdRef.detectChanges();
              }
            }, 10000);
          }
        }
      });
  
      if (!found && sessionStorage.getItem('showHighlightInfoOnce') === 'true') {
        this.toastr.info('No matching projects found.', 'Message', { timeOut: 4000 });
      }
  
      sessionStorage.removeItem('showHighlightInfoOnce');
    }, 500);
  }

  
  ngOnDestroy() {
    sessionStorage.removeItem('highlightedProject'); // Clear highlight state when user leaves the page
  }


  
  // openDeleteModal(project: any) {
  //   this.selectedProjectId = project.projectId; // Correctly assign ID from the clicked item
  //   this.selectedProjectIndex = this.projects.findIndex(p => p.projectId === project.projectId); // Optional: if you still need the original index
  //   this.deleteModal.show();
  // }

  openDeleteModal(project: any) {
    this.selectedProjectId = project.projectId;
    this.selectedProjectIndex = this.projects.findIndex(p => p.projectId === project.projectId);
  
    // Re-initialize the modal with options
    this.deleteModal = new Modal(this.deleteModalRef.nativeElement, {
      backdrop: 'static',
      keyboard: false
    });
  
    this.deleteModal.show();
  }
  
  



  // deleteProject() {
  //   if (!this.selectedProjectId) return;

  //   // 1. Delete the project by projectId
  //   this.projectsService.deleteProjectByProjectId(this.selectedProjectId).subscribe(() => {
  //     this.toastr.success('Project deleted successfully!', 'Success')
  //     // 2. Delete related phases
  //     this.projectsService.deletePhasesByProjectId(this.selectedProjectId).subscribe(() => {
  //       // 3. Refresh project list
  //       this.loadProjects();
  //       this.closeDeleteModal();
  //     });
  //   });
  // }


  isDeleting: boolean = false;

  // deleteProject() {
  //   if (!this.selectedProjectId) return;
  
  //   this.projectsService.deleteProjectByProjectId(this.selectedProjectId).subscribe(() => {
  //     this.toastr.success('Project deleted successfully!', 'Success');
  //     this.projectsService.deletePhasesByProjectId(this.selectedProjectId).subscribe(() => {
  //       this.loadProjects();
  //       this.closeDeleteModal();
  //     });
  //   });
  // }

  deleteProject() {
    if (!this.selectedProjectId) return;
  
    this.isDeleting = true;
  
    this.projectsService.deleteProjectByProjectId(this.selectedProjectId).subscribe({
      next: () => {
        this.toastr.success('Project deleted successfully!', 'Success');
        this.projectsService.deletePhasesByProjectId(this.selectedProjectId).subscribe({
          next: () => {
            this.loadProjects();
            this.closeDeleteModal();
            this.isDeleting = false; // Reset after both deletes
          },
          error: () => {
            this.toastr.error('Failed to delete project phases', 'Error');
            this.isDeleting = false;
          }
        });
      },
      error: () => {
        this.toastr.error('Failed to delete project', 'Error');
        this.isDeleting = false;
      }
    });
  }
  
  

  closeDeleteModal() {
    this.deleteModal?.hide(); // Hide modal
  }
  

  loadPhases(index: number, projectId: string): void {
    this.projectsService.getPhases(projectId).subscribe(
      (response) => {
        if (response.docs) {
          this.projects[index].phases = response.docs.map((phase: any) => ({
            ...phase,
            milestones: phase.milestones || [], // Ensure milestones array exists
            expanded: phase.expanded || false, // Ensure each phase has an expanded property
          }));
        }
        console.log(`Phases for Project ${projectId}:`, this.projects[index].phases);
      },
      (error) => {
        console.error('Error fetching phases:', error);
      }
    );
  }

  createProject(): void {
  this.modalInstance = new Modal(this.projectModal.nativeElement, {
    backdrop: 'static',  // Prevents closing the modal when clicking outside
    keyboard: false      // Prevents closing the modal when pressing the Escape key
  });
  this.modalInstance.show();
}


openPhaseModal(): void {
  this.phaseModalInstance = new Modal(this.AddPhaseModal.nativeElement, {
    backdrop: 'static',  // Prevents closing the modal when clicking outside
    keyboard: false      // Prevents closing the modal when pressing the Escape key
  });
  this.phaseModalInstance.show();
}





  toggleExpand(project: any) {
    project.expanded = !project.expanded;
  
    if (project.expanded) {
      this.loadPhasesById(project);
    }
  }
  

  loadPhasesById(project: any) {
    const index = this.projects.findIndex(p => p.projectId === project.projectId);
    if (index !== -1) {
      this.loadPhases(index, project.projectId); // Keep your original method for phase loading
    }
  }
  
  

  // togglePhaseExpand(projectIndex: number, phaseIndex: number) {
  //   this.projects[projectIndex].phases[phaseIndex].expanded = 
  //     !this.projects[projectIndex].phases[phaseIndex].expanded;
  // }
  

  togglePhaseExpand(project: any, phase: any) {
    phase.expanded = !phase.expanded;
  }
  


  calculateDownPayment(amount: number, percentage: number): number {
    return (amount * percentage) / 100;
  }

  calculatePhaseAmount(totalAmount: number, downPaymentPercentage: number, phasePercentage: number): number {
    const balance = totalAmount - this.calculateDownPayment(totalAmount, downPaymentPercentage);
    return (balance * phasePercentage) / 100;
  }

  calculateTotalBalance(totalAmount: number, downPaymentPercentage: number): number {
    const downPaymentAmount = (totalAmount * downPaymentPercentage) / 100;
    return totalAmount - downPaymentAmount;
  }

  
  

  

  //phase creation
  newPhases: any[] = [];

  newPhase: any = {
    phaseName: '',
    startDate: '',
    deadline: '',
    percentage: '',
    amountToBill: '',
    progress: 0
  };



  isSaving = false; // Flag to track saving state
  // saveProject() {
  //   if (this.isSaving) return; // If already saving, prevent multiple clicks

  //   this.isSaving = true; // Set the flag to true to indicate saving is in progress

  //   const clearErrorStyles = (ref: ElementRef) => {
  //     if (ref.nativeElement && ref.nativeElement.classList) {
  //       ref.nativeElement.classList.remove('ng-touched');
  //       ref.nativeElement.classList.remove('ng-invalid');
  //     }
  //   };
  //   clearErrorStyles(this.projectNameRef);
  //   clearErrorStyles(this.projectDescriptionRef);
  //   clearErrorStyles(this.clientNameRef);
  //   clearErrorStyles(this.startDateRef);
  //   clearErrorStyles(this.deadlineRef);
  //   clearErrorStyles(this.totalAmountRef);
  //   clearErrorStyles(this.downPaymentRef);  

    
  //   this.projectNameModel.control.markAsTouched();
  //   this.projectDescriptionModel.control.markAsTouched();
  //   this.clientNameModel.control.markAsTouched();
  //   this.startDateModel.control.markAsTouched();
  //   this.deadlineModel.control.markAsTouched();
  //   this.totalAmountModel.control.markAsTouched();
  //   this.downPaymentModel.control.markAsTouched();

    
   
    

  //   const missingFields: string[] = [];

  //   if (!this.newProject.projectName) {
  //     this.scrollTo(this.projectNameRef);
  //     this.isSaving = false;
  //     return;
  //   }
  //   if (!this.newProject.projectDescription) {
  //     this.scrollTo(this.projectDescriptionRef);
  //     this.isSaving = false;
  //     return;
  //   }
  //   if (!this.newProject.clientName) {
  //     this.scrollTo(this.clientNameRef);
  //     this.isSaving = false;
  //     return;
  //   }
  //   if (!this.newProject.startDate) {
  //     this.scrollTo(this.startDateRef);
  //     this.isSaving = false;
  //     return;
  //   }
  //   if (!this.newProject.deadline) {
  //     this.scrollTo(this.deadlineRef);
  //     this.isSaving = false;
  //     return;
  //   }
  //   if (this.newProject.totalAmount == null) {
  //     this.scrollTo(this.totalAmountRef);
  //     this.isSaving = false;
  //     return;
  //   }
  //   if (this.newProject.downPayment == null) {
  //     this.scrollTo(this.downPaymentRef);
  //     this.isSaving = false;
  //     return;
  //   }

  //   this.projectsService.getProjects().subscribe(
  //     (response) => {
  //       const projects = response.rows.map((row: any) => row.doc);
  //       let maxId = 0;

  //       projects.forEach((project: any) => {
  //         if (project.projectId && !isNaN(Number(project.projectId))) {
  //           maxId = Math.max(maxId, Number(project.projectId));
  //         }
  //       });

  //       const newProjectId = (maxId + 1).toString().padStart(4, '0');
  //       this.newProject.projectId = newProjectId;

  //       this.projectsService.createProject(this.newProject).subscribe(
  //         (projectResponse) => {
  //           this.toastr.success('Project saved successfully', 'Success');
  //           this.loadProjects();

  //           this.newPhases.forEach((phase) => {
  //             const phaseData = {
  //               ...phase,
  //               projectId: newProjectId
  //             };

  //             this.projectsService.createPhase(phaseData).subscribe(
  //               (phaseResponse) => {
  //                 console.log('Phase saved:', phaseResponse);
  //               },
  //               (phaseError) => {
  //                 console.error('Error saving phase:', phaseError);
  //                 this.toastr.error('Failed to save phase', 'Error');
  //               }
  //             );
  //           });

  //           this.cancelForm();
  //           this.modalInstance.hide();
  //           this.isSaving = false;
            
  //         },
  //         (error) => {
  //           this.toastr.error('Failed to save project', 'Error');
  //           console.error(error);
  //           this.isSaving = false;
  //         }
  //       );
  //     },
  //     (error) => {
  //       this.toastr.error('Failed to fetch projects', 'Error');
  //       console.error(error);
  //     }
  //   );
  // }




  isPercentage: boolean = true;

  saveProject() {
    if (this.isSaving) return;
  
    this.isSaving = true;
  
    const clearErrorStyles = (ref: ElementRef) => {
      if (ref.nativeElement && ref.nativeElement.classList) {
        ref.nativeElement.classList.remove('ng-touched', 'ng-invalid');
      }
    };
  
    const refs = [
      this.projectNameRef,
      this.projectDescriptionRef,
      this.clientNameRef,
      this.startDateRef,
      this.deadlineRef,
      this.totalAmountRef,
      this.downPaymentRef
    ];
  
    refs.forEach(clearErrorStyles);
  
    const models = [
      this.projectNameModel,
      this.projectDescriptionModel,
      this.clientNameModel,
      this.startDateModel,
      this.deadlineModel,
      this.totalAmountModel,
      this.downPaymentModel
    ];
  
    models.forEach((model) => model.control.markAsTouched());
  
    const requiredFields = [
      { value: this.newProject.projectName, ref: this.projectNameRef },
      { value: this.newProject.projectDescription, ref: this.projectDescriptionRef },
      { value: this.newProject.clientName, ref: this.clientNameRef },
      { value: this.newProject.startDate, ref: this.startDateRef },
      { value: this.newProject.deadline, ref: this.deadlineRef },
      { value: this.newProject.totalAmount, ref: this.totalAmountRef },
      { value: this.newProject.downPayment, ref: this.downPaymentRef }
    ];
  
    for (const field of requiredFields) {
      if (field.value == null || field.value === '') {
        this.scrollTo(field.ref);
        this.isSaving = false;
        return;
      }
    }
  
    this.projectsService.getProjects().subscribe({
      next: (response) => {
        const projects = response.rows.map((row: any) => row.doc);
        const maxId = projects.reduce((max: number, project: any) =>
          project.projectId && !isNaN(Number(project.projectId)) ?
            Math.max(max, Number(project.projectId)) : max, 0);
  
        const newProjectId = (maxId + 1).toString().padStart(4, '0');
        this.newProject.projectId = newProjectId;
  

        const totalAmount = this.newProject.totalAmount || 0;
        const inputValue = this.newProject.downPayment || 0;
        let downPaymentAmount = 0;
        let downPaymentPercentage = 0;

        if (this.downPaymentType === 'percent') {
          downPaymentPercentage = inputValue;
          downPaymentAmount = (totalAmount * downPaymentPercentage) / 100;
        } else if (this.downPaymentType === 'peso') {
          downPaymentAmount = inputValue;
          downPaymentPercentage = (inputValue / totalAmount) * 100;
        }

        // Store percentage in CouchDB as requested
        this.newProject.downPayment = downPaymentPercentage.toFixed(2); // Save as string percentage (e.g., "50.00")

        // Save both calculated values
        this.newProject.downPaymentAmount = downPaymentAmount;
        this.newProject.totalBalanceAfterDownPayment = totalAmount - downPaymentAmount;
        this.newProject.progress = 0;


  
        this.projectsService.createProject(this.newProject).subscribe({
          next: (projectResponse) => {
            this.toastr.success('Project saved successfully', 'Success');
            this.loadProjects();
  
            this.newPhases.forEach((phase) => {
              const phaseData = {
                ...phase,
                projectId: newProjectId
              };
  
              this.projectsService.createPhase(phaseData).subscribe({
                next: (phaseResponse) => console.log('Phase saved:', phaseResponse),
                error: (phaseError) => {
                  console.error('Error saving phase:', phaseError);
                  this.toastr.error('Failed to save phase', 'Error');
                }
              });
            });
  
            this.cancelForm();
            this.modalInstance.hide();
            this.isSaving = false;
          },
          error: (error) => {
            console.error(error);
            this.toastr.error('Failed to save project', 'Error');
            this.isSaving = false;
          }
        });
      },
      error: (error) => {
        console.error(error);
        this.toastr.error('Failed to fetch projects', 'Error');
        this.isSaving = false;
      }
    });
  }
  


  scrollTo(ref: ElementRef) {
    ref.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    ref.nativeElement.focus();
  
    // Mark as touched to trigger validation styles
    if (ref.nativeElement && ref.nativeElement.classList) {
      ref.nativeElement.classList.add('ng-touched');
      ref.nativeElement.classList.add('ng-invalid');
    }
  }

  resetValidation(model: NgModel, ref: ElementRef) {
    if (ref.nativeElement && ref.nativeElement.classList) {
      ref.nativeElement.classList.remove('ng-touched');
      ref.nativeElement.classList.remove('ng-invalid');
    }
    model.control.markAsPristine();
    model.control.markAsUntouched();
  }
  
  



  // addPhase() {
  //   if (!this.newPhase.phaseName || !this.newPhase.startDate || !this.newPhase.deadline || !this.newPhase.percentage || !this.newPhase.amountToBill) {
  //     this.toastr.info('Please fill out all phase details before adding.');
  //     return;
  //   }

  //   let newTotalPercentage = this.totalPhasePercentage + this.newPhase.percentage;

  //   if (newTotalPercentage > 100) {
  //     this.toastr.error(`Cannot add this phase. Total percentage will exceed 100%.`, 'Error');
  //     return; // Stop execution
  //   }

  //   // Generate phaseId (4-digit number)
  //   let maxId = this.newPhases.length > 0 
  //     ? Math.max(...this.newPhases.map(p => Number(p.phaseId))) 
  //     : 0;
  //   const newPhaseId = (maxId + 1).toString().padStart(4, '0');

  //   // Add new phase with an empty milestones array and a newMilestone object
  //   this.newPhases.push({ 
  //     phaseId: newPhaseId,
  //     phaseName: this.newPhase.phaseName,
  //     startDate: this.newPhase.startDate,
  //     deadline: this.newPhase.deadline,
  //     percentage: this.newPhase.percentage,
  //     amountToBill: this.newPhase.amountToBill,
  //     progress: 0,
  //     milestones: [],
  //     newMilestone: { name: '', amount: null }, // Stores new milestone input
  //     showMilestoneForm: true
  //   });
  //   this.totalPhasePercentage = newTotalPercentage; // Update total percentage
    
  //   // Reset form
  //   this.newPhase = { phaseName: '', startDate: '', deadline: '', percentage: '', amountToBill: '' };
  // }


  isAddingPhase: boolean = false;

addPhase() {
  if (!this.newPhase.phaseName || !this.newPhase.startDate || !this.newPhase.deadline || !this.newPhase.percentage || !this.newPhase.amountToBill) {
    this.toastr.info('Please fill out all phase details before adding.');
    return;
  }

  let newTotalPercentage = this.totalPhasePercentage + this.newPhase.percentage;

  if (newTotalPercentage > 100) {
    this.toastr.error(`Cannot add this phase. Total percentage will exceed 100%.`, 'Error');
    return;
  }

  this.isAddingPhase = true; // Start loading

  setTimeout(() => { // Simulate async behavior, remove if not needed
    let maxId = this.newPhases.length > 0 
      ? Math.max(...this.newPhases.map(p => Number(p.phaseId))) 
      : 0;

    const newPhaseId = (maxId + 1).toString().padStart(4, '0');

    this.newPhases.push({ 
      phaseId: newPhaseId,
      phaseName: this.newPhase.phaseName,
      startDate: this.newPhase.startDate,
      deadline: this.newPhase.deadline,
      percentage: this.newPhase.percentage,
      amountToBill: this.newPhase.amountToBill,
      progress: 0,
      milestones: [],
      newMilestone: { name: '', amount: null },
      showMilestoneForm: true
    });

    this.totalPhasePercentage = newTotalPercentage;

    // Reset form
    this.newPhase = { phaseName: '', startDate: '', deadline: '', percentage: '', amountToBill: '' };

    this.isAddingPhase = false; // Stop loading
  }, 500); // Adjust/remove timeout based on real-world async needs
}


deletingPhaseId: string | null = null;


  // deletePhase(phaseId: string) {
  //   // Filter out the phase with the matching phaseId
  //   this.newPhases = this.newPhases.filter(phase => phase.phaseId !== phaseId);
  
  //   // Recalculate total percentage after deletion
  //   this.totalPhasePercentage = this.newPhases.reduce((sum, phase) => sum + phase.percentage, 0);
  //   this.toastr.success('Phase deleted successfully.');
  // }

  deletePhase(phaseId: string) {
    this.deletingPhaseId = phaseId;
  
    // Optional: simulate async operation
    setTimeout(() => {
      // Filter out the phase with the matching phaseId
      this.newPhases = this.newPhases.filter(phase => phase.phaseId !== phaseId);
  
      // Recalculate total percentage after deletion
      this.totalPhasePercentage = this.newPhases.reduce((sum, phase) => sum + phase.percentage, 0);
  
      this.toastr.success('Phase deleted successfully.');
      this.deletingPhaseId = null; // Reset loading state
    }, 300); // Adjust or remove delay as needed
  }
  
  

  // toggleMilestoneForm(phase: any): void {
  //   phase.showMilestoneForm = !phase.showMilestoneForm;
    
  //   if (!phase.newMilestone) {
  //     phase.newMilestone = { name: '', amount: null };
  //   }
  // }

  getTotalMilestoneAmount(phase: any): number {
    return phase.milestones?.reduce((sum: number, milestone: any) => sum + milestone.amount, 0) || 0;
  }
  
  

  resetPhaseForm() {
    this.newPhase = {
      phaseName: '',
      startDate: '',
      deadline: '',
      percentage: '',
      amountToBill: ''
    };
  }
  



  isLoading: boolean = false;  // Add this line

  cancelForm() {
    this.isLoading = true;

    const clearErrorStyles = (ref: ElementRef) => {
      if (ref.nativeElement && ref.nativeElement.classList) {
        ref.nativeElement.classList.remove('ng-touched');
        ref.nativeElement.classList.remove('ng-invalid');
      }
    };
    this.resetValidation(this.projectNameModel, this.projectNameRef);
    this.resetValidation(this.projectDescriptionModel, this.projectDescriptionRef);
    this.resetValidation(this.clientNameModel, this.clientNameRef);
    this.resetValidation(this.startDateModel, this.startDateRef);
    this.resetValidation(this.deadlineModel, this.deadlineRef);
    this.resetValidation(this.totalAmountModel, this.totalAmountRef);
    this.resetValidation(this.downPaymentModel, this.downPaymentRef);


    
    this.newProject = {
      projectName: '',
      projectDescription: '',
      clientName: '',
      startDate: '',
      deadline: '',
      totalAmount: null,
      downPayment: null
    };

    this.isSaving = false;

    this.modalInstance.hide();
    this.resetPhaseForm();
    this.newPhases = [];    
    this.totalPhasePercentage = 0; // Reset total percentage

    this.isLoading = false;
  }




  closeAddPhaseModal() {
    this.phaseModalInstance.hide();

  }

  // addMilestone(phase: any) {
  //   if (!phase.newMilestone.name || !phase.newMilestone.amount) {
  //     this.toastr.warning('Please enter both Milestone Name and Amount.');
  //     return;
  //   }

  //   const milestoneAmount = phase.newMilestone.amount || 0;
  //   const totalMilestoneAmount = this.getTotalMilestoneAmount(phase) + milestoneAmount;

  //   if (totalMilestoneAmount > phase.amountToBill) {
  //     this.toastr.warning(
  //       `Milestone total exceeds the allowed ₱${phase.amountToBill.toLocaleString()}. Remaining: ₱${(phase.amountToBill - this.getTotalMilestoneAmount(phase)).toLocaleString()}`,
  //       'Warning'
  //     );
  //     return;
  //   }

  //   // Add milestone
  //   phase.milestones.push({ 
  //     name: phase.newMilestone.name, 
  //     amount: phase.newMilestone.amount ,
  //     previousOld:0,
  //     previous: 0,
  //     present: 0,
  //     presentValue: 0,
  //     amountDue: 0,
  //     presentMilestoneDue:0,
  //     progress: "On Progress"
  //   });

    

  //   // Reset milestone form
  //   phase.newMilestone = { name: '', amount: null };
  // }


  addMilestone(phase: any) {
    if (!phase.newMilestone.name || !phase.newMilestone.amount) {
      this.toastr.warning('Please enter both Milestone Name and Amount.');
      return;
    }
  
    const milestoneAmount = phase.newMilestone.amount || 0;
    const totalMilestoneAmount = this.getTotalMilestoneAmount(phase) + milestoneAmount;
  
    if (totalMilestoneAmount > phase.amountToBill) {
      this.toastr.warning(
        `Milestone total exceeds the allowed ₱${phase.amountToBill.toLocaleString()}. Remaining: ₱${(phase.amountToBill - this.getTotalMilestoneAmount(phase)).toLocaleString()}`,
        'Warning'
      );
      return;
    }
  
    // Start loading
    phase.isAddingMilestone = true;
  
    setTimeout(() => { // Simulate async or delay if needed
      // Add milestone
      phase.milestones.push({ 
        name: phase.newMilestone.name, 
        amount: phase.newMilestone.amount,
        previousOld: 0,
        previous: 0,
        present: 0,
        presentValue: 0,
        amountDue: 0,
        presentMilestoneDue: 0,
        progress: "On Progress"
      });
  
      // Reset milestone form
      phase.newMilestone = { name: '', amount: null };
  
      // Stop loading
      phase.isAddingMilestone = false;
    }, 300); // Remove this if adding is truly instant
  }
  

  getRemainingAmount(phase: any): number {
    // Sum the amounts of all milestones added for this phase
    const totalMilestoneAmount = phase.milestones.reduce((sum, milestone) => sum + (milestone.amount || 0), 0);
  
    // Calculate remaining amount by subtracting the milestone amounts from the phase's amountToBill
    return phase.amountToBill - totalMilestoneAmount;
  }
  


  calculateAmountToBill(): void {
    let totalBalance = this.getTotalBalance(); // Use total balance instead of total project amount
    let remainingPercentage = 100 - this.totalPhasePercentage;
  
    if (this.newPhase.percentage && totalBalance) {
      if (this.newPhase.percentage > remainingPercentage) {
        this.toastr.warning(
          `Total phase percentage cannot exceed 100%. Remaining allowed: ${remainingPercentage}%`,
          'Warning'
        );
        this.newPhase.percentage = remainingPercentage; // Limit to max available
      }
      this.newPhase.amountToBill = (this.newPhase.percentage / 100) * totalBalance;
    } else {
      this.newPhase.amountToBill = 0; // Default to 0 if values are missing
    }
  }
  


  // getTotalBalance(): number {
  //   let downPaymentAmount = (this.newProject.downPayment / 100) * this.newProject.totalAmount; // Convert percentage to actual amount
  //   return this.newProject.totalAmount - downPaymentAmount;
  // }

  getTotalBalance(): number {
    let downPaymentAmount = 0;
  
    if (this.downPaymentType === 'percent') {
      downPaymentAmount = (this.newProject.downPayment / 100) * this.newProject.totalAmount;
    } else if (this.downPaymentType === 'peso') {
      downPaymentAmount = this.newProject.downPayment;
    }
  
    return this.newProject.totalAmount - downPaymentAmount;
  }
  
  // getRemainingTotalBalance(): number {
  // const downPaymentAmount = (this.newProject.downPayment / 100) * this.newProject.totalAmount;

  // // Sum all added phase billings
  // const billedAmount = this.newPhases.reduce((sum, phase) => sum + Number(phase.amountToBill || 0), 0);

  // return this.newProject.totalAmount - downPaymentAmount - billedAmount;
  // }

  getRemainingTotalBalance(): number {
    let downPaymentAmount = 0;
  
    if (this.downPaymentType === 'percent') {
      downPaymentAmount = (this.newProject.downPayment / 100) * this.newProject.totalAmount;
    } else if (this.downPaymentType === 'peso') {
      downPaymentAmount = this.newProject.downPayment;
    }
  
    const billedAmount = this.newPhases.reduce((sum, phase) => sum + Number(phase.amountToBill || 0), 0);
  
    return this.newProject.totalAmount - downPaymentAmount - billedAmount;
  }
  

  getUnallocatedPercentage(): number {
    return Math.max(0, Math.floor(100 - this.totalPhasePercentage));
  }




  

  validateDownPayment() {
    if (this.newProject.downPayment > 100) {
      this.newProject.downPayment = 100; // Auto-set to 100
      this.toastr.warning(
        'Down payment cannot exceed 100%! It has been adjusted.',
        'Warning',
        { timeOut: 3000 }
      );
    }
  
    if (this.newProject.downPayment < 0) {
      this.newProject.downPayment = 0;
    }
  }






  // deleteMilestone(phase: any, milestoneIndex: number) {
  //   phase.milestones.splice(milestoneIndex, 1);
  //   this.toastr.success('Milestone deleted successfully.');
  // }


  deleteMilestone(phase: any, milestoneIndex: number) {
    // Start loading for this milestone
    phase.deletingMilestoneIndex = milestoneIndex;
  
    // Simulate async delay (optional: for UX)
    setTimeout(() => {
      phase.milestones.splice(milestoneIndex, 1);
      this.toastr.success('Milestone deleted successfully.');
  
      // Reset loading
      phase.deletingMilestoneIndex = null;
    }, 300); // Adjust or remove timeout if instant
  }
  





  // editPhase(phase: any) {
  //   // Store original values in case user cancels
  //   phase.originalData = { ...phase };
  //   phase.isEditing = true;
  // }

  editPhase(phase: any) {
    // Store original values in case user cancels
    if (!phase.originalData) {
      phase.originalData = [];
    }
  
    // Limit the number of backups to 3
    if (phase.originalData.length >= 3) {
      phase.originalData.shift(); // Remove the oldest backup
    }
  
    // Store the current state as a backup
    phase.originalData.push({ ...phase });
    phase.isEditing = true;
  }

  validatePhaseAmount(phase: any, item: any): void {
  const maxAmount = this.calculatePhaseAmount(item.totalAmount, item.downPayment, 100); // Full available balance
  if (phase.amountToBill > maxAmount) {
    phase.amountToBill = maxAmount;
  } else if (phase.amountToBill < 0) {
    phase.amountToBill = 0;
  }
}

  

  


  // cancelEditPhase(phase: any) {
  //   // Restore original values
  //   Object.assign(phase, phase.originalData);
  //   delete phase.originalData;
  //   phase.isEditing = false;
  // }


  cancelEditPhase(phase: any) {
    if (phase.originalData && phase.originalData.length > 0) {
      // Restore the most recent backup
      Object.assign(phase, phase.originalData[phase.originalData.length - 1]);
      // Remove the last backup after restoring
      phase.originalData.pop();
    }
  
    phase.isEditing = false;
  }
  





    // savesPhase(phases: any, project: any) {
    //   if (!phases._id) {
    //     console.error("Phase ID is missing!");
    //     return;
    //   }
    
    //   // Calculate the total percentage of all phases, excluding the one being edited
    //   const otherPhasesTotal = project.phases
    //     .filter((p: any) => p._id !== phases._id) // Exclude the current phase
    //     .reduce((sum: number, p: any) => sum + p.percentage, 0);
    
    //   const newTotal = otherPhasesTotal + phases.percentage;
    
    //   if (newTotal > 100) {
    //     this.toastr.error(`Total phase percentage cannot exceed 100%. Currently: ${newTotal}%`);
    //     return;
    //   }
    
    //   // Fetch the latest _rev before updating the phase
    //   this.projectsService.getPhaseById(phases._id).subscribe(
    //     (latestPhase: any) => {
    //       if (latestPhase._rev) {
    //         phases._rev = latestPhase._rev; // Update to the latest _rev
    
    //         // Remove the originalData property to avoid circular references before sending to the backend
    //         delete phases.originalData;
    
    //         // Update the phase
    //         this.projectsService.updatePhase(phases).subscribe(
    //           (response: any) => {
    //             console.log("Phase updated successfully:", response);
    //             this.toastr.success("Phase updated successfully!");
                
    
    //             // After phase update, recalculate project progress
    //             this.projectsService.updateProjectProgress(project.projectId).subscribe(
    //               (projectUpdateResponse) => {
    //                 console.log("Project progress updated successfully:", projectUpdateResponse);
    //                 // this.toastr.success("Project progress updated!");
    //                 phases.isEditing = false; // Exit edit mode after saving
    //               },
    //               (error) => {
    //                 console.error("Error updating project progress:", error);
    //               }
    //             );
    //           },
    //           (error) => {
    //             console.error("Error updating phase:", error);
    //           }
    //         );
    //       } else {
    //         console.error("Failed to fetch latest revision (_rev).");
    //       }
    //     },
    //     (error) => {
    //       console.error("Error fetching latest _rev:", error);
    //     }
    //   );
    // }


    savesPhase(phases: any, project: any) {
      if (!phases._id) {
        console.error("Phase ID is missing!");
        return;
      }
    
      phases.isSaving = true; // Start loading
    
      const otherPhasesTotal = project.phases
        .filter((p: any) => p._id !== phases._id)
        .reduce((sum: number, p: any) => sum + p.percentage, 0);
    
      const newTotal = otherPhasesTotal + phases.percentage;
    
      // if (newTotal > 100) {
      //   this.toastr.error(`Total phase percentage cannot exceed 100%. Currently: ${newTotal}%`);
      //   phases.isSaving = false;
      //   return;
      // }
      if (newTotal > 100) {
        const remaining = 100 - otherPhasesTotal;
        this.toastr.error(`You can only assign up to ${remaining}% to this phase.`);
        phases.isSaving = false;
        return;
      }
      
    
      this.projectsService.getPhaseById(phases._id).subscribe({
        next: (latestPhase: any) => {
          if (latestPhase._rev) {
            phases._rev = latestPhase._rev;
            delete phases.originalData;
    
            this.projectsService.updatePhase(phases).subscribe({
              next: (response: any) => {
                console.log("Phase updated successfully:", response);
                this.toastr.success("Phase updated successfully!");
    
                this.projectsService.updateProjectProgress(project.projectId).subscribe({
                  next: (projectUpdateResponse) => {
                    console.log("Project progress updated successfully:", projectUpdateResponse);
                    phases.isEditing = false;
                    phases.isSaving = false;
                  },
                  error: (err) => {
                    console.error("Error updating project progress:", err);
                    phases.isSaving = false;
                  }
                });
              },
              error: (err) => {
                console.error("Error updating phase:", err);
                phases.isSaving = false;
              }
            });
          } else {
            console.error("Failed to fetch latest revision (_rev).");
            phases.isSaving = false;
          }
        },
        error: (err) => {
          console.error("Error fetching latest _rev:", err);
          phases.isSaving = false;
        }
      });
    }
    
  







  editMilestone(phase: any, milestone: any) {
    milestone.isEditing = true;
    milestone.originalData = { ...milestone }; // Store original values for cancel // Optional: store original values for cancel
    // Clear the fields when editing starts
    milestone.present = 0;
    milestone.amountDue = 0;
  }

  cancelEditMilestone(milestone: any) {
    Object.assign(milestone, milestone.originalData); // Restore original values
    milestone.isEditing = false;

    milestone.present = 0;
    milestone.amountDue = 0;
  }


  // saveMilestone(phase: any, milestone: any, project: any) {
  //   if (!phase._id) {
  //     console.error("Phase ID is missing!");
  //     return;
  //   }
  
  //   // Fetch the latest _rev before updating
  //   this.projectsService.getPhaseById(phase._id).subscribe(
  //     (latestPhase: any) => {
  //       if (latestPhase._rev) {
  //         phase._rev = latestPhase._rev; // Ensure the latest _rev is used
  
  //         // Calculate milestone limits
  //         const maxMilestoneAmount = this.calculatePhaseAmount(project.totalAmount, project.downPayment, phase.percentage);
  //         const currentTotalMilestones = phase.milestones.reduce((sum: number, m: any) => sum + (m.amount || 0), 0);
  //         const remainingAmount = maxMilestoneAmount - (currentTotalMilestones - milestone.amount);
  
  //         if (currentTotalMilestones > maxMilestoneAmount) {
  //           this.toastr.error(`Cannot save milestone. You can only allocate ₱${remainingAmount.toLocaleString()} more.`, 'Error');
  //           return;
  //         }
  
  //         // Update milestone progress
  //         milestone.progress = milestone.previous === 100 ? "Completed" : "In Progress";
  
  //         // ✅ Recalculate phase progress dynamically
  //         const totalMilestones = phase.milestones.length;
  //         let totalProgress = 0;
  
  //         phase.milestones.forEach((m: any) => {
  //           const milestoneProgressPercentage = m.previous;
  //           totalProgress += (milestoneProgressPercentage / 100) * (100 / totalMilestones);
  //         });
  
  //         phase.progress = totalProgress; // ✅ Update phase progress
  
  //         // ✅ Immediately update project progress locally
  //         this.updateProjectProgress(project);
  
  //         // Update the milestones array
  //         const updatedMilestones = phase.milestones.map((m: any) =>
  //           m === milestone ? { ...milestone, isEditing: false } : m
  //         );
  
  //         const updatedPhase = { ...phase, milestones: updatedMilestones };
  
  //         // Save the updated phase and milestone
  //         this.projectsService.updatePhase(updatedPhase).subscribe(
  //           (response: any) => {
  //             console.log("Milestone updated successfully:", response);
  //             milestone.isEditing = false; // Exit edit mode
  
  //             // ✅ After saving the phase, update the project progress in the backend
  //             this.projectsService.updateProjectProgress(project.projectId).subscribe(
  //               (projectUpdateResponse) => {
  //                 console.log("Project progress updated successfully:", projectUpdateResponse);
  //               },
  //               (error) => {
  //                 console.error("Error updating project progress:", error);
  //               }
  //             );
  //           },
  //           (error) => {
  //             console.error("Error updating milestone:", error);
  //           }
  //         );
  //       } else {
  //         console.error("Failed to fetch latest revision (_rev).");
  //       }
  //     },
  //     (error) => {
  //       console.error("Error fetching latest _rev:", error);
  //     }
  //   );
  // }

  saveMilestone(phase: any, milestone: any, project: any) {
    if (!phase._id) {
      console.error("Phase ID is missing!");
      return;
    }
  
    milestone.isSaving = true; // Start loading
  
    this.projectsService.getPhaseById(phase._id).subscribe({
      next: (latestPhase: any) => {
        if (latestPhase._rev) {
          phase._rev = latestPhase._rev;
  
          const maxMilestoneAmount = this.calculatePhaseAmount(project.totalAmount, project.downPayment, phase.percentage);
          const currentTotalMilestones = phase.milestones.reduce((sum: number, m: any) => sum + (m.amount || 0), 0);
          const remainingAmount = maxMilestoneAmount - (currentTotalMilestones - milestone.amount);
  
          if (currentTotalMilestones > maxMilestoneAmount) {
            this.toastr.error(`Cannot save milestone. You can only allocate ₱${remainingAmount.toLocaleString()} more.`, 'Error');
            milestone.isSaving = false;
            return;
          }
  
          milestone.progress = milestone.previous === 100 ? "Completed" : "In Progress";
  
          const totalMilestones = phase.milestones.length;
          let totalProgress = 0;
  
          phase.milestones.forEach((m: any) => {
            totalProgress += (m.previous / 100) * (100 / totalMilestones);
          });
  
          phase.progress = totalProgress;
          this.updateProjectProgress(project);
  
          const updatedMilestones = phase.milestones.map((m: any) =>
            m === milestone ? { ...milestone, isEditing: false } : m
          );
  
          const updatedPhase = { ...phase, milestones: updatedMilestones };
  
          this.projectsService.updatePhase(updatedPhase).subscribe({
            next: (response: any) => {
              console.log("Milestone updated successfully:", response);
              milestone.isEditing = false;
              milestone.isSaving = false;
  
              this.projectsService.updateProjectProgress(project.projectId).subscribe({
                next: (res) => {
                  console.log("Project progress updated successfully:", res);
                },
                error: (err) => {
                  console.error("Error updating project progress:", err);
                }
              });
            },
            error: (err) => {
              console.error("Error updating milestone:", err);
              milestone.isSaving = false;
            }
          });
        } else {
          console.error("Failed to fetch latest revision (_rev).");
          milestone.isSaving = false;
        }
      },
      error: (err) => {
        console.error("Error fetching latest _rev:", err);
        milestone.isSaving = false;
      }
    });
  }
  



  
  //frontend display
  updateProjectProgress(project: any) {
    let totalProgress = 0;
  
    project.phases.forEach((phase: any) => {
      const phaseContribution = (phase.progress / 100) * phase.percentage;
      totalProgress += phaseContribution;
    });
  
    project.progress = Math.round(totalProgress); // Update project progress

    if (project.progress >= 100) {
      this.pendingProjects = this.pendingProjects.filter(p => p.projectName !== project.projectName);
    }
  }



  calculateAmountDue(milestone: any) {
    if (milestone.present !== null && milestone.amount !== null) {
      milestone.amountDue = (milestone.present / 100) * milestone.amount;
    } else {
      milestone.amountDue = 0;
    }
  }

  getTotalAmountDue(milestones: any[]): number {
    return milestones.reduce((sum, milestone) => sum + (milestone.amountDue || 0), 0);
  }

  isSavingInvoice = false;

  // saveAndGenerateInvoice(phases: any) {
  //   this.isSavingInvoice = true; // Start loading
  //   let isValid = true;
  //   const updateRequests: any[] = [];
  
  //   phases.milestones.forEach((milestone: any) => {
  //     if (milestone.present > 0) {
  //       const newPrevious = milestone.previous + milestone.present;
  //       const remainingPercent = 100 - milestone.previous;
  
  //       if (newPrevious > 100) {
  //         this.toastr.warning(
  //           `Milestone "${milestone.name}" cannot exceed 100%. You can only add ${remainingPercent}% more.`,
  //           'Warning'
  //         );
  //         isValid = false;
  //         return;
  //       }
  
  //       milestone.previousOld = milestone.previous;
  //       milestone.presentValue = milestone.present;
  //       milestone.presentMilestoneDue = milestone.amountDue;
  //       milestone.amountDue = 0;
  //       milestone.previous = newPrevious;
  //       milestone.present = 0;
  
  //       const updatedMilestone = {
  //         name: milestone.name,
  //         previous: milestone.previous,
  //         previousOld: milestone.previousOld,
  //         present: milestone.present,
  //         presentValue: milestone.presentValue,
  //         amountDue: milestone.amountDue,
  //         presentMilestoneDue: milestone.presentMilestoneDue,
  //         progress: milestone.progress
  //       };
  
  //       const req = this.projectsService.updateMilestone(phases._id, updatedMilestone).toPromise()
  //         .then(res => console.log('Milestone updated:', res))
  //         .catch(err => console.error('Error updating milestone:', err));
  
  //       updateRequests.push(req);
  //       this.calculateAmountDue(milestone);
  //     }
  //   });
  
  //   if (!isValid) {
  //     this.isSavingInvoice = false;
  //     return;
  //   }
  
  //   Promise.all(updateRequests).then(() => {
  //     this.updatePhaseProgressFromMilestones(phases);
  //     this.generateInvoice(phases.milestones);
  //     this.isSavingInvoice = false; // End loading
  //   });
  // }


  saveAndGenerateInvoice(phases: any) {
    this.isSavingInvoice = true;
    let isValid = true;
    const updateRequests: any[] = [];
  
    phases.milestones.forEach((milestone: any) => {
      if (milestone.present > 0) {
        const newPrevious = milestone.previous + milestone.present;
        const remainingPercent = 100 - milestone.previous;
  
        if (newPrevious > 100) {
          this.toastr.warning(
            `Milestone "${milestone.name}" cannot exceed 100%. You can only add ${remainingPercent}% more.`,
            'Warning'
          );
          isValid = false;
          return;
        }
  
        milestone.previousOld = milestone.previous;
        milestone.presentValue = milestone.present;
        milestone.presentMilestoneDue = milestone.amountDue;
        milestone.amountDue = 0;
        milestone.previous = newPrevious;
        milestone.present = 0;
  
        const updatedMilestone = {
          name: milestone.name,
          previous: milestone.previous,
          previousOld: milestone.previousOld,
          present: milestone.present,
          presentValue: milestone.presentValue,
          amountDue: milestone.amountDue,
          presentMilestoneDue: milestone.presentMilestoneDue,
          progress: milestone.progress
        };
  
        const req = this.projectsService.updateMilestone(phases._id, updatedMilestone).toPromise()
          .then(res => console.log('Milestone updated:', res))
          .catch(err => console.error('Error updating milestone:', err));
  
        updateRequests.push(req);
        this.calculateAmountDue(milestone);
      }
    });
  
    if (!isValid) {
      this.isSavingInvoice = false;
      return;
    }
  
    Promise.all(updateRequests).then(() => {
      this.updatePhaseProgressFromMilestones(phases);
  
      // 👇 Make sure `phases.projectId` contains the actual projectId
      const projectId = phases.projectId;
  
      // 🧾 Call to update the project progress after updating milestones and phase progress
      this.projectsService.updateProjectProgress(projectId).subscribe({
        next: () => {
          console.log('Project progress updated successfully.');
          this.generateInvoice(phases.milestones);
          this.isSavingInvoice = false;
        },
        error: (err) => {
          console.error('Error updating project progress:', err);
          this.toastr.error('Failed to update project progress.', 'Error');
          this.isSavingInvoice = false;
        }
      });
    });
  }
  
  


  updatePhaseProgressFromMilestones(phase: any) {
    if (!phase.milestones || phase.milestones.length === 0) {
      phase.progress = 0;
      return;
    }
  
    const total = phase.milestones.reduce((acc: number, m: any) => acc + (m.previous || 0), 0);
    const average = total / phase.milestones.length;
    phase.progress = Math.min(Math.round(average), 100);
  }
  
  
  
  //jasperreports
  generateInvoice(milestones: any[]) {
    console.log('Generating Invoice for milestones:', milestones);
    this.toastr.success('Invoice generated successfully!', 'Success');
  }



  // downPaymentType: string = 'percent'; // default selection
  downPaymentType: 'percent' | 'peso' = 'percent'; // default
  



  

  //initial downpayment creation form
  limitInputLength(event: any, maxLength: number) {
    const input = event.target.value;
  
    // If input is longer than allowed digits
    if (input.length > maxLength) {
      event.target.value = input.slice(0, maxLength);
    }
  
    // If input is greater than 100, force it to 100
    if (+event.target.value > 100) {
      event.target.value = '100';
    }
  
    // Update ngModel binding manually
    this.newProject.downPayment = parseInt(event.target.value, 10);
  }


  // limitProgressInput(event: any, phases: any) {
  //   let inputValue = event.target.value;
  
  //   // If the input is empty or null, set it to 0
  //   if (inputValue === '' || inputValue === null) {
  //     inputValue = '0';
  //   }
  
  //   // If the input length exceeds 3 digits, slice it to 3 digits
  //   if (inputValue.length > 3) {
  //     inputValue = inputValue.slice(0, 3);
  //   }
  
  //   // If the input is greater than 100, reset to 100
  //   if (+inputValue > 100) {
  //     inputValue = '100';
  //   }
  
  //   // Update the phases progress with the cleaned value
  //   phases.progress = parseInt(inputValue, 10);
  // }

  limitProgressInput(event: any, phases: any) {
    let inputValue = event.target.value;
  
    // Default to 0 if input is empty or null
    if (inputValue === '' || inputValue === null) {
      inputValue = '0';
    }
  
    // Limit input to 3 characters max
    if (inputValue.length > 3) {
      inputValue = inputValue.slice(0, 3);
    }
  
    // Convert to number and enforce range 0–100
    let numericValue = +inputValue;
    if (numericValue > 100) {
      numericValue = 100;
    } else if (numericValue < 0) {
      numericValue = 0;
    }
  
    // Update input display and model binding
    event.target.value = numericValue;
    phases.progress = numericValue;
  }
  
  

  // limitPhasePercentageInput(event: any) {
  //   let inputValue = event.target.value;
  
  //   // If input is null or empty, set to 0
  //   if (inputValue === '' || inputValue === null) {
  //     inputValue = '0';
  //   }
  
  //   // Limit to 3 digits
  //   if (inputValue.length > 3) {
  //     inputValue = inputValue.slice(0, 3);
  //   }
  
  //   // Enforce 0 to 100 range
  //   const numericValue = +inputValue;
  //   if (numericValue > 100) {
  //     inputValue = '100';
  //   } else if (numericValue < 0) {
  //     inputValue = '0';
  //   }
  
  //   // Update the input field
  //   event.target.value = inputValue;
  
  //   // Update the model
  //   this.newPhase.percentage = parseInt(inputValue, 10);
  // }
  
  
  limitPhasePercentageInput(event: any) {
    let inputValue = event.target.value;
  
    // If input is null or empty, set to 0
    if (inputValue === '' || inputValue === null) {
      inputValue = '0';
    }
  
    // Limit to 3 digits (for safety, in case someone tries to type '1000' or something larger)
    if (inputValue.length > 3) {
      inputValue = inputValue.slice(0, 3);
    }
  
    // Enforce 0 to 100 range
    const numericValue = +inputValue;
    if (numericValue > 100) {
      inputValue = '100';
    } else if (numericValue < 0) {
      inputValue = '0';
    }
  
    // Update the input field value
    event.target.value = inputValue;
  
    // Update the model (this binds the percentage value to the model for two-way binding)
    this.phases.percentage = parseInt(inputValue, 10);
  }
  



  limitMilestoneInputLength(event: any, milestone: any, maxLength: number): void {
    let inputValue = event.target.value;
  
    // Limit max characters
    if (inputValue.length > maxLength) {
      inputValue = inputValue.slice(0, maxLength);
      event.target.value = inputValue;
    }
  
    // Limit value to max 100
    if (+inputValue > 100) {
      inputValue = '100';
      event.target.value = inputValue;
    }
  
    // Limit value to min 0
    if (+inputValue < 0) {
      inputValue = '0';
      event.target.value = inputValue;
    }
  
    // Update ngModel manually
    milestone.present = parseInt(inputValue, 10) || 0;
  
    // Optionally recalculate
    this.calculateAmountDue(milestone);
  }




  // markMilestoneAsComplete(phase: any, milestone: any, project: any) {
  //   if (!phase._id) {
  //     console.error("Phase ID is missing!");
  //     return;
  //   }
  
  //   // ✅ Reset milestone data
  //   milestone.present = 0;        // Clear the input
  //   milestone.amountDue = 0;      // Clear the amount due
  //   milestone.previous = 100;     // Mark as completed
  //   milestone.progress = "Completed";
  
  //   this.saveMilestone(phase, milestone, project); // Reuse existing logic
  // }





  // markMilestoneAsComplete(phase: any, milestone: any, project: any) {
  //   if (!phase._id) {
  //     console.error("Phase ID is missing!");
  //     return;
  //   }
  
  //   // 🔢 Step 1: Compute the remaining percentage
  //   const remainingPercent = 100 - milestone.previous;
  
  //   // ✅ If already completed, do nothing
  //   if (remainingPercent <= 0) {
  //     this.toastr.info(`Milestone "${milestone.name}" is already 100% complete.`, 'Info');
  //     return;
  //   }
  
  //   // 💰 Step 2: Compute presentMilestoneDue based on remaining percent
  //   const presentMilestoneDue = (milestone.amount * remainingPercent) / 100;
  
  //   //  Step 3: Update milestone fields before saving
  //   milestone.presentValue = remainingPercent;
  //   milestone.presentMilestoneDue = presentMilestoneDue;
  //   milestone.amountDue = 0;
  //   milestone.present = 0;
  //   milestone.previousOld = milestone.previous;
  //   milestone.previous = 100;
  //   milestone.progress = "Completed";
  
  //   //  Optionally log the update
  //   console.log(`Marking "${milestone.name}" as complete with +${remainingPercent}% (₱${presentMilestoneDue})`);
  
  //   //  Step 4: Save changes using existing logic
  //   this.saveMilestone(phase, milestone, project);
  // }
  


  markMilestoneAsComplete(phase: any, milestone: any, project: any) {
  if (!phase._id) {
    console.error("Phase ID is missing!");
    return;
  }

  // ✅ Already completed
  if (milestone.previous >= 100) {
    this.toastr.info(`Milestone "${milestone.name}" is already 100% complete.`, 'Info');
    return;
  }

  // 🔢 Step 1: Compute remaining percentage
  const remainingPercent = 100 - milestone.previous;

  // 💰 Step 2: Compute presentMilestoneDue for remaining progress
  const presentMilestoneDue = (milestone.amount * remainingPercent) / 100;

  // 🔧 Step 3: Update milestone fields
  milestone.previousOld = milestone.previous;
  milestone.previous = 100;
  milestone.presentValue = remainingPercent;
  milestone.presentMilestoneDue = presentMilestoneDue;
  milestone.amountDue = 0;
  milestone.present = 0;
  milestone.progress = "Completed";
  milestone.isEditing = true; // Optional: for UI editing trigger

  // 📝 Step 4: Log and Save
  console.log(`Marking "${milestone.name}" as complete with +${remainingPercent}% (₱${presentMilestoneDue})`);
  this.saveMilestone(phase, milestone, project);
}




  
  





// markPhaseAsComplete(phase: any, project: any): void {
//   if (!phase._id) {
//     console.error("Phase ID is missing!");
//     return;
//   }

//   // Fetch the latest _rev before updating
//   this.projectsService.getPhaseById(phase._id).subscribe(
//     (latestPhase: any) => {
//       if (latestPhase._rev) {
//         phase._rev = latestPhase._rev;

//         // ✅ Set all milestones to 100%
//         phase.milestones = phase.milestones.map((milestone: any) => ({
//           ...milestone,
//           previous: 100,
//           progress: "Completed"
//         }));
        

//         // ✅ Set phase progress to 100%
//         phase.progress = 100;

//         // ✅ Mark the phase as completed (this flag will be used in the template)
//         phase.completed = true;

//         // ✅ Update project progress locally
//         this.updateProjectProgress(project);

//         // ✅ Save updated phase
//         this.projectsService.updatePhase(phase).subscribe(
//           (response: any) => {
//             console.log("Phase marked as complete:", response);

//             // ✅ Update the overall project progress in DB
//             this.projectsService.updateProjectProgress(project.projectId).subscribe(
//               (projectUpdateResponse) => {
//                 console.log("Project progress updated:", projectUpdateResponse);
//               },
//               (error) => {
//                 console.error("Error updating project progress:", error);
//               }
//             );
//           },
//           (error) => {
//             console.error("Error updating phase:", error);
//           }
//         );
//       } else {
//         console.error("Could not fetch latest _rev.");
//       }
//     },
//     (error) => {
//       console.error("Error fetching phase _rev:", error);
//     }
//   );
// }






  markPhaseAsComplete(phase: any, project: any): void {
    if (!phase._id) {
      console.error("Phase ID is missing!");
      return;
    }

    this.projectsService.getPhaseById(phase._id).subscribe(
      (latestPhase: any) => {
        if (latestPhase._rev) {
          phase._rev = latestPhase._rev;

          // ✅ Reset milestone.present and amountDue to 0 before marking complete
          phase.milestones = phase.milestones.map((milestone: any) => ({
            ...milestone,
            present: 0,
            amountDue: 0,
            previous: 100,
            progress: "Completed"
          }));

          // ✅ Set phase progress to 100%
          phase.progress = 100;
          phase.completed = true;

          this.updateProjectProgress(project);

          this.projectsService.updatePhase(phase).subscribe(
            (response: any) => {
              console.log("Phase marked as complete:", response);

              this.projectsService.updateProjectProgress(project.projectId).subscribe(
                (projectUpdateResponse) => {
                  console.log("Project progress updated:", projectUpdateResponse);
                },
                (error) => {
                  console.error("Error updating project progress:", error);
                }
              );
            },
            (error) => {
              console.error("Error updating phase:", error);
            }
          );
        } else {
          console.error("Could not fetch latest _rev.");
        }
      },
      (error) => {
        console.error("Error fetching phase _rev:", error);
      }
    );
  }

  limitPreviousInput(event: any, milestone: any) {
    let inputValue = event.target.value;

    // Default to 0 if input is empty or null
    if (inputValue === '' || inputValue === null) {
      inputValue = '0';
    }

    // Limit to 3 characters
    if (inputValue.length > 3) {
      inputValue = inputValue.slice(0, 3);
    }

    // Convert to number and clamp between 0–100
    let numericValue = +inputValue;
    if (numericValue > 100) {
      numericValue = 100;
    } else if (numericValue < 0) {
      numericValue = 0;
    }

    // Update both the input field and the model
    event.target.value = numericValue;
    milestone.previous = numericValue;
  }









  displayedDownPayment: number = 0; // what the user types

  // onDownPaymentInput(event: any): void {
  //   let inputValue = event.target.value;

  //   if (this.downPaymentType === 'percent') {
  //     // Limit to 3 digits
  //     inputValue = inputValue.slice(0, 3);

  //     let percent = Number(inputValue);

  //     if (percent > 100) {
  //       percent = 100;
  //     } else if (percent < 0 || isNaN(percent)) {
  //       percent = 0;
  //     }

  //     this.newProject.downPayment = percent;
  //     event.target.value = percent; // ✅ Reflect change in the input box

  //   } else {
  //     // Peso mode: up to total project amount
  //     let pesoAmount = Number(inputValue);

  //     if (pesoAmount > this.newProject.totalAmount) {
  //       pesoAmount = this.newProject.totalAmount;
  //     } else if (pesoAmount < 0 || isNaN(pesoAmount)) {
  //       pesoAmount = 0;
  //     }

  //     this.newProject.downPayment = pesoAmount;
  //     event.target.value = pesoAmount; // ✅ Reflect change in the input box
  //   }
  // }

  onDownPaymentInput(event: any): void {
    let inputValue = event.target.value;
  
    if (inputValue === '') {
      this.newProject.downPayment = ''; // Keep it blank if user deletes the value
      return;
    }
  
    if (this.downPaymentType === 'percent') {
      inputValue = inputValue.slice(0, 3);
      let percent = Number(inputValue);
  
      if (percent > 100) {
        percent = 100;
      } else if (percent < 0 || isNaN(percent)) {
        percent = 0;
      }
  
      this.newProject.downPayment = percent;
      event.target.value = percent;
  
    } else {
      let pesoAmount = Number(inputValue);
  
      if (pesoAmount > this.newProject.totalAmount) {
        pesoAmount = this.newProject.totalAmount;
      } else if (pesoAmount < 0 || isNaN(pesoAmount)) {
        pesoAmount = 0;
      }
  
      this.newProject.downPayment = pesoAmount;
      event.target.value = pesoAmount;
    }
  }
  

// onDownPaymentTypeChange(newType: 'percent' | 'peso'): void {
//   this.downPaymentType = newType;
//   this.newProject.downPayment = 0;
// }

  // onDownPaymentTypeChange(newType: 'percent' | 'peso'): void {
  //   this.downPaymentType = newType;
  //   this.newProject.downPayment = 0;

  //   if (newType === 'percent') {
  //     this.displayedDownPayment = this.newProject.downPayment || 0;
  //   } else {
  //     const totalAmount = this.newProject.totalAmount || 0;
  //     this.displayedDownPayment = Math.round((totalAmount * (this.newProject.downPayment || 0)) / 100);
  //   }
  // }

  onDownPaymentTypeChange(newType: 'percent' | 'peso'): void {
    this.downPaymentType = newType;
    this.newProject.downPayment = ''; // Clear the field by default
    this.displayedDownPayment = 0; // Reset the displayed value if needed
  }
  

  formatProgress(value: number): string {
    return Number.isInteger(value) ? value.toString() : value.toFixed(2);
  }

  formatPercentage(value: number): string {
    const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
    return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2);
  }

  roundPercentage(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  normalizePercentage(value: number): number {
    const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
    return Math.abs(rounded - 100) < 0.01 ? 100 : rounded;
  }




  
  
  
}
