import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule,HeaderComponent],
  templateUrl: './homepage.component.html', // Add this line
  styleUrls: ['./homepage.component.css']    // Add this line
})
export class HomepageComponent {
  constructor(private router : Router){}
}
