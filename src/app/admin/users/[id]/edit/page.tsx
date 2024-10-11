import { fetchHelperServer } from "@/lib/fetch-helper-server";
import { UserEditForm } from "@/components/admin/user-edit-form";
import { User } from "@/types/db";

export default async function EditUserPage({
  params,
}: {
  params: { id: string };
}) {
  const user = (await fetchHelperServer(
    `/api/admin/users/${params.id}`
  )) as User;

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-5">Edit User</h1>
      <UserEditForm user={user} />
    </div>
  );
}