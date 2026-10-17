export interface Member {
  id: number;
  name: string;
}

export function getMembersById(members: Member[]) {
  return new Map(members.map((member) => [member.id, member]));
}
