import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-signing-pad',
  template: `
    <canvas (mousedown)="onMouseDown($event)" (mousemove)="onMouseMove($event)" (touchmove)="onMouseMove($event)"
            (touchstart)="onMouseDown($event)" #signPad width="350" height="200">
    </canvas>
    <button (click)="clearSignature()">Clear</button>
    <button (click)="saveSignature()" [disabled]="!hasDrawnContent">Save</button>
    <div style="height:10px"><small *ngIf="!hasDrawnContent">*signature is required!</small></div>
  `,
  styles: [
    `
    :host {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    button {
      background-color: #1976d2;
      color: white;
      font-weight: 600;
      height: 35px;
      border-radius: 3px;
      border: none;
    }

    button:disabled {
      background-color: #8dc2f7; /* Change the background color to grey */
      cursor: not-allowed; /* Change the cursor to indicate it's not clickable */
    }

    canvas {
      border: 1px solid black;
    }
  `,
  ],
})
export class SignatureComponent {
  @ViewChild('signPad', { static: false })
  signPad!: ElementRef<HTMLCanvasElement>;
  @Output() signatureSaved = new EventEmitter();
  signatureImg?: string;
  hasDrawnContent: boolean = false;
  private sigPadElement: any;
  private context: any;
  private isDrawing!: boolean;

  public ngAfterViewInit(): void {
    this.sigPadElement = this.signPad.nativeElement;
    this.context = this.sigPadElement.getContext('2d');
    this.context.strokeStyle = '#000';

    this.canvasResize();
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(e: any): void {
    this.isDrawing = false;
  }

  canvasResize() {
    const canvas = this.sigPadElement;
    // Adjust canvas dimensions based on its parent element's size
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
    // You may need to reset the drawing context properties here if needed
  }

  onMouseDown(e: any): void {
    this.isDrawing = true;
    this.hasDrawnContent = true; // Set the flag to true when drawing starts
    const coords = this.relativeCoords(e);
    this.context.moveTo(coords.x, coords.y);
  }

  onMouseMove(e: any): void {
    if (this.isDrawing) {
      this.hasDrawnContent = true; // Set the flag to true when drawing starts
      const coords = this.relativeCoords(e);
      this.context.lineTo(coords.x, coords.y);
      this.context.stroke();
    }
  }

  clearSignature(): void {
    this.signatureImg = undefined;
    this.context.clearRect(
      0,
      0,
      this.sigPadElement.width,
      this.sigPadElement.height
    );
    this.context.beginPath();

    // Reset the flag to false when the canvas is cleared
    this.hasDrawnContent = false;
  }

  saveSignature(): void {
    this.signatureImg = this.sigPadElement.toDataURL('image/png');
    this.signatureSaved.emit(this.signatureImg);
  }

  private relativeCoords(event: any): { x: number; y: number } {
    const bounds = event.target.getBoundingClientRect();
    const cords = {
      clientX: event.clientX || event.changedTouches[0].clientX,
      clientY: event.clientY || event.changedTouches[0].clientY,
    };
    const x = cords.clientX - bounds.left;
    const y = cords.clientY - bounds.top;
    return { x, y };
  }
}
