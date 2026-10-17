import { inject, Injectable, Injector, runInInjectionContext, signal } from '@angular/core';
import { delay, map, Observable, take, timer } from 'rxjs';
import { Member } from '../model/member';
import { toObservable } from '@angular/core/rxjs-interop';

const memberNamePattern = /^[A-Za-z]+(\s+[A-Za-z]+)*$/;
const getMembersDelay = 1000;
const addMemberDelay = 1500;
const defaultMembers: Member[] = [
  { name: 'Bob', id: 1 },
  { name: 'Alice', id: 2 },
  { name: 'Mark', id: 3 },
  { name: 'John', id: 4 },
];
const defaultLastMemberId = Math.max(0, ...defaultMembers.map((member) => member.id));

@Injectable({ providedIn: 'root' })
export class MemberService {
  private members = signal<Member[]>(defaultMembers);
  private lastMemberId = defaultLastMemberId;
  private injector = inject(Injector);

  getMembers(): Observable<Member[]> {
    return runInInjectionContext(this.injector, () => toObservable(this.members).pipe(take(1), delay(getMembersDelay)));
  }

  addMember(member: Member): Observable<Member> {
    const newMemberName = member.name.trim().replaceAll(/\s+/g, ' ');
    const newMemberNameValidationError = this.validateNewMemberName(newMemberName);
    if (newMemberNameValidationError) {
      return timer(addMemberDelay).pipe(
        map(() => {
          throw newMemberNameValidationError;
        }),
      );
    }

    const newMember = { id: ++this.lastMemberId, name: newMemberName };
    this.members.update((value) => [...value, newMember]);

    return timer(addMemberDelay).pipe(map(() => newMember));
  }

  private validateNewMemberName(memberName: string): Error | null {
    if (memberName === '') {
      return new Error('Member name is required.');
    } else if (!memberNamePattern.test(memberName)) {
      return new Error('Member name must contain only English alphabet characters and whitespace characters.');
    } else if (this.members().some((existingMember) => existingMember.name === memberName)) {
      return Error('Member with the same name already exists.');
    }

    return null;
  }
}
