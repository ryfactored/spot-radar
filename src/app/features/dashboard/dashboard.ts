import { Component, inject, OnInit } from '@angular/core';
import { SupabaseService } from '../../core/supabase';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: '<h1>Dashboard</h1><p>Check browser console for Supabase client</p>'
})
export class Dashboard implements OnInit {
  private supabase = inject(SupabaseService);

  ngOnInit() {
    console.log('Supabase client:', this.supabase.client);
  }
}