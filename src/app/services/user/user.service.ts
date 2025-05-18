import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

interface UserRole {
  Role: string;
  [key: string]: string | undefined;
}

interface Admin extends UserRole {
  AdminId: string;
}

interface Doctor extends UserRole {
  DoctorId: string;
}

interface Receptionist extends UserRole {
  ReceptionistId: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {

  constructor(private firestore: AngularFirestore) {}

  getUserRole(uid: string): Observable<string | null> {
    const getRoleFromCollection = (collection: string, idField: string, roleField: string): Observable<string | null> => {
      return this.firestore.collection(collection, ref => ref.where(idField, '==', uid)).get().pipe(
        map(snapshot => {
          if (snapshot.empty) return null;
          const data = snapshot.docs[0].data() as UserRole;
          return data[roleField] || null;
        })
      );
    };

    const adminRole$ = getRoleFromCollection('admins', 'AdminId', 'Role'); // Adjust 'AdminId' and 'Role' if different
    const doctorRole$ = getRoleFromCollection('doctors', 'DoctorId', 'Role'); // Adjust 'DoctorId' and 'Role' if different
    const receptionistRole$ = getRoleFromCollection('receptionists', 'ReceptionistId', 'Role'); // Adjust 'ReceptionistId' and 'Role' if different

    return forkJoin([adminRole$, doctorRole$, receptionistRole$]).pipe(
      map(roles => roles.find(role => role !== null) || null)
    );
  }
}