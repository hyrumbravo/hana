import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import 'datatables.net-buttons/js/buttons.html5.js';
import 'datatables.net-buttons/js/buttons.print.js';
import { Modal } from 'bootstrap';
import { ProjectsService } from '@services/projects/projects.service';
import { forkJoin } from 'rxjs';



@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss']
})
export class ProjectsComponent implements OnInit {
  @ViewChild('deleteModal') deleteModalRef!: ElementRef;
  deleteModal!: any;
  selectedProjectIndex!: number;
  selectedProjectId!: string; // Store the Project ID
  
  @ViewChild('projectModal') projectModal!: ElementRef;
  modalInstance!: Modal;


  @ViewChild('pendingModal', { static: false }) pendingModal!: ElementRef;
  pendingmodalInstance!: any;


  



  totalPhasePercentage: number = 0; // Tracks total percentage used

  
  
  // Projects array for display
  projects:any = [];
  
  newProject: any = {
    projectName: '',
    projectDescription: '',
    clientName: '',
    startDate: '',
    deadline: '',
    totalAmount: null,
    downPayment: 0,
    progress: 0 // Default progress value
  };

  // phase array for display
  phases:any = [];


  
  dtOptions: DataTables.Settings = {};
  loading = false; // Flag for showing a loading spinner
  
  currentEmployee: any = {}; 
  currentTimelog: any = {}; 
  timeIn: string = '';
  timeOut: string = '';
  
  constructor(private toastr: ToastrService, private projectsService: ProjectsService) {}


  ngOnInit(): void {
    this.loadProjects();

    


    // datatables cofig
    this.dtOptions = {
      language: {
        search: '',
        searchPlaceholder: 'Search',
        lengthMenu: 'Show _MENU_ entries'
      },
      ordering: true,
      paging: true,
      pageLength: 10,
      searching: true,
      lengthChange: true,
    };


  }

  

  ngAfterViewInit() {
    // Initialize Bootstrap modal after view loads
    this.deleteModal = new Modal(this.deleteModalRef.nativeElement);
  }

  // openDeleteModal(index: number) {
  //   this.selectedProjectIndex = index; // Store the project index (if needed)
  //   this.deleteModal?.show(); // Show modal
  // }

  openDeleteModal(index: number) {
    this.selectedProjectIndex = index;
    this.selectedProjectId = this.projects[index].projectId; // Get Project ID
    this.deleteModal.show();
  }


  deleteProject() {
    if (!this.selectedProjectId) return;

    // 1. Delete the project by projectId
    this.projectsService.deleteProjectByProjectId(this.selectedProjectId).subscribe(() => {
      this.toastr.success('Project deleted successfully!', 'Success')
      // 2. Delete related phases
      this.projectsService.deletePhasesByProjectId(this.selectedProjectId).subscribe(() => {
        // 3. Refresh project list
        this.loadProjects();
        this.closeDeleteModal();
      });
    });
  }

  closeDeleteModal() {
    this.deleteModal?.hide(); // Hide modal
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
        }
      },
      error: (error) => {
        this.toastr.error('Failed to load projects', 'Error');
        console.error('Error fetching projects:', error);
      },
    });
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
  
  

  // refresh timelogs
  

  createProject(): void {
    this.modalInstance = new Modal(this.projectModal.nativeElement);
    this.modalInstance.show();
  }


  toggleExpand(index: number) {
    this.projects[index].expanded = !this.projects[index].expanded;
  
    if (this.projects[index].expanded) {
      this.loadPhases(index, this.projects[index].projectId);
    }
  }
  
  
  

  togglePhaseExpand(projectIndex: number, phaseIndex: number) {
    this.projects[projectIndex].phases[phaseIndex].expanded = 
      !this.projects[projectIndex].phases[phaseIndex].expanded;
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
  

  // editPhase(projectIndex: number, phaseIndex: number) {
  //   this.phases[phaseIndex].isEditing = true;
  // }

  // savePhase(projectIndex: number, phaseIndex: number) {
  //   const project = this.projects[projectIndex];
  //   const phase = this.phases[phaseIndex];

  //   const totalPhasePercentage = this.phases.reduce((sum, p, i) => sum + (i === phaseIndex ? phase.percentage : p.percentage), 0);
  //   if (totalPhasePercentage > 100) {
  //     alert("Total phase percentage cannot exceed 100%");
  //     return;
  //   }

  //   phase.isEditing = false;
  // }




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



  //project creation
    
  saveProject() {
  // this.newProject.progress = 0;
  if (!this.newProject.projectName || !this.newProject.startDate || !this.newProject.deadline) {
    this.toastr.warning('Please fill in the fields', 'Warning');
    return;
  }

  this.projectsService.getProjects().subscribe(
    (response) => {
      const projects = response.rows.map((row: any) => row.doc);

      // Find the highest existing projectId
      let maxId = 0;
      projects.forEach((project: any) => {
        if (project.projectId && !isNaN(Number(project.projectId))) {
          maxId = Math.max(maxId, Number(project.projectId));
        }
      });

      // Generate a new projectId
      const newProjectId = (maxId + 1).toString().padStart(4, '0');

      // Assign projectId
      this.newProject.projectId = newProjectId;

      // Step 1: Save project to CouchDB (projects database)
      this.projectsService.createProject(this.newProject).subscribe(
        (projectResponse) => {
          this.toastr.success('Project saved successfully', 'Success');
          this.loadProjects();

          // Step 2: Save each phase separately in CouchDB (project_phase database)
          this.newPhases.forEach((phase) => {
            const phaseData = {
              ...phase,
              projectId: newProjectId // Link phase to the project
            };

            this.projectsService.createPhase(phaseData).subscribe(
              (phaseResponse) => {
                console.log('Phase saved:', phaseResponse);
              },
              (phaseError) => {
                console.error('Error saving phase:', phaseError);
                this.toastr.error('Failed to save phase', 'Error');
              }
            );
          });
          this.cancelForm();
          this.modalInstance.hide();
        },
        (error) => {
          this.toastr.error('Failed to save project', 'Error');
          console.error(error);
        }
      );
    },
    (error) => {
      this.toastr.error('Failed to fetch projects', 'Error');
      console.error(error);
    }
  );
}


  addPhase() {
    if (!this.newPhase.phaseName || !this.newPhase.startDate || !this.newPhase.deadline || !this.newPhase.percentage || !this.newPhase.amountToBill) {
      this.toastr.info('Please fill out all phase details before adding.');
      return;
    }

    let newTotalPercentage = this.totalPhasePercentage + this.newPhase.percentage;

    if (newTotalPercentage > 100) {
      this.toastr.error(`Cannot add this phase. Total percentage will exceed 100%.`, 'Error');
      return; // Stop execution
    }

    // Generate phaseId (4-digit number)
    let maxId = this.newPhases.length > 0 
      ? Math.max(...this.newPhases.map(p => Number(p.phaseId))) 
      : 0;
    const newPhaseId = (maxId + 1).toString().padStart(4, '0');

    // Add new phase with an empty milestones array and a newMilestone object
    this.newPhases.push({ 
      phaseId: newPhaseId,
      phaseName: this.newPhase.phaseName,
      startDate: this.newPhase.startDate,
      deadline: this.newPhase.deadline,
      percentage: this.newPhase.percentage,
      amountToBill: this.newPhase.amountToBill,
      progress: 0,
      milestones: [],
      newMilestone: { name: '', amount: null }, // Stores new milestone input
      showMilestoneForm: true
    });
    this.totalPhasePercentage = newTotalPercentage; // Update total percentage
    // Reset form
    this.newPhase = { phaseName: '', startDate: '', deadline: '', percentage: '', amountToBill: '' };
  }

  deletePhase(phaseId: string) {
    // Filter out the phase with the matching phaseId
    this.newPhases = this.newPhases.filter(phase => phase.phaseId !== phaseId);
  
    // Recalculate total percentage after deletion
    this.totalPhasePercentage = this.newPhases.reduce((sum, phase) => sum + phase.percentage, 0);
    this.toastr.success('Phase deleted successfully.');
  }
  

  toggleMilestoneForm(phase: any): void {
    phase.showMilestoneForm = !phase.showMilestoneForm;
    
    if (!phase.newMilestone) {
      phase.newMilestone = { name: '', amount: null };
    }
  }

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
  

  cancelForm() {
    this.newProject = {
      projectName: '',
      projectDescription: '',
      clientName: '',
      startDate: '',
      deadline: '',
      totalAmount: null,
      downPayment: null
    };
    this.modalInstance.hide();
    this.resetPhaseForm();
    this.newPhases = [];    
    this.totalPhasePercentage = 0; // Reset total percentage
  }




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

    // Add milestone
    phase.milestones.push({ 
      name: phase.newMilestone.name, 
      amount: phase.newMilestone.amount ,
      previous: 0,
      present: 0,
      amountDue: 0,
      progress: "On Progress"
    });

    // Reset milestone form
    phase.newMilestone = { name: '', amount: null };
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
  


  getTotalBalance(): number {
    let downPaymentAmount = (this.newProject.downPayment / 100) * this.newProject.totalAmount; // Convert percentage to actual amount
    return this.newProject.totalAmount - downPaymentAmount;
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




  deleteMilestone(phase: any, milestoneIndex: number) {
    phase.milestones.splice(milestoneIndex, 1);
    this.toastr.success('Milestone deleted successfully.');
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
  





  savesPhase(phases: any, project: any) {
    if (!phases._id) {
      console.error("Phase ID is missing!");
      return;
    }
  
    // Calculate the total percentage of all phases, excluding the one being edited
    const otherPhasesTotal = project.phases
      .filter((p: any) => p._id !== phases._id) // Exclude the current phase
      .reduce((sum: number, p: any) => sum + p.percentage, 0);
  
    const newTotal = otherPhasesTotal + phases.percentage;
  
    if (newTotal > 100) {
      this.toastr.error(`Total phase percentage cannot exceed 100%. Currently: ${newTotal}%`);
      return;
    }
  
    // Fetch the latest _rev before updating the phase
    this.projectsService.getPhaseById(phases._id).subscribe(
      (latestPhase: any) => {
        if (latestPhase._rev) {
          phases._rev = latestPhase._rev; // Update to the latest _rev
  
          // Remove the originalData property to avoid circular references before sending to the backend
          delete phases.originalData;
  
          // Update the phase
          this.projectsService.updatePhase(phases).subscribe(
            (response: any) => {
              console.log("Phase updated successfully:", response);
              this.toastr.success("Phase updated successfully!");
              
  
              // After phase update, recalculate project progress
              this.projectsService.updateProjectProgress(project.projectId).subscribe(
                (projectUpdateResponse) => {
                  console.log("Project progress updated successfully:", projectUpdateResponse);
                  // this.toastr.success("Project progress updated!");
                  phases.isEditing = false; // Exit edit mode after saving
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
          console.error("Failed to fetch latest revision (_rev).");
        }
      },
      (error) => {
        console.error("Error fetching latest _rev:", error);
      }
    );
  }
  


  








  editMilestone(phase: any, milestone: any) {
    milestone.isEditing = true;
    milestone.originalData = { ...milestone }; // Store original values for cancel
  }

  cancelEditMilestone(milestone: any) {
    Object.assign(milestone, milestone.originalData); // Restore original values
    milestone.isEditing = false;
  }


  saveMilestone(phase: any, milestone: any, project: any) {
    if (!phase._id) {
      console.error("Phase ID is missing!");
      return;
    }
  
    // Fetch the latest _rev before updating
    this.projectsService.getPhaseById(phase._id).subscribe(
      (latestPhase: any) => {
        if (latestPhase._rev) {
          phase._rev = latestPhase._rev; // Ensure the latest _rev is used
  
          // Calculate milestone limits
          const maxMilestoneAmount = this.calculatePhaseAmount(project.totalAmount, project.downPayment, phase.percentage);
          const currentTotalMilestones = phase.milestones.reduce((sum: number, m: any) => sum + (m.amount || 0), 0);
          const remainingAmount = maxMilestoneAmount - (currentTotalMilestones - milestone.amount);
  
          if (currentTotalMilestones > maxMilestoneAmount) {
            this.toastr.error(`Cannot save milestone. You can only allocate ₱${remainingAmount.toLocaleString()} more.`, 'Error');
            return;
          }
  
          // Update milestone progress
          milestone.progress = milestone.previous === 100 ? "Completed" : "In Progress";
  
          // ✅ Recalculate phase progress dynamically
          const totalMilestones = phase.milestones.length;
          let totalProgress = 0;
  
          phase.milestones.forEach((m: any) => {
            const milestoneProgressPercentage = m.previous;
            totalProgress += (milestoneProgressPercentage / 100) * (100 / totalMilestones);
          });
  
          phase.progress = totalProgress; // ✅ Update phase progress
  
          // ✅ Immediately update project progress locally
          this.updateProjectProgress(project);
  
          // Update the milestones array
          const updatedMilestones = phase.milestones.map((m: any) =>
            m === milestone ? { ...milestone, isEditing: false } : m
          );
  
          const updatedPhase = { ...phase, milestones: updatedMilestones };
  
          // Save the updated phase and milestone
          this.projectsService.updatePhase(updatedPhase).subscribe(
            (response: any) => {
              console.log("Milestone updated successfully:", response);
              milestone.isEditing = false; // Exit edit mode
  
              // ✅ After saving the phase, update the project progress in the backend
              this.projectsService.updateProjectProgress(project.projectId).subscribe(
                (projectUpdateResponse) => {
                  console.log("Project progress updated successfully:", projectUpdateResponse);
                },
                (error) => {
                  console.error("Error updating project progress:", error);
                }
              );
            },
            (error) => {
              console.error("Error updating milestone:", error);
            }
          );
        } else {
          console.error("Failed to fetch latest revision (_rev).");
        }
      },
      (error) => {
        console.error("Error fetching latest _rev:", error);
      }
    );
}


  
  
  
  
  







  //frontend display
  updateProjectProgress(project: any) {
    let totalProgress = 0;
  
    project.phases.forEach((phase: any) => {
      const phaseContribution = (phase.progress / 100) * phase.percentage;
      totalProgress += phaseContribution;
    });
  
    project.progress = Math.round(totalProgress); // Update project progress
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



  
  
  

  


  


  
  

}
