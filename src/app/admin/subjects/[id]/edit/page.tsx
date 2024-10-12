import { fetchHelperServer } from "@/lib/fetch-helper-server";
import { SubjectEditForm } from "@/components/admin/subject-edit-form";
import { Subject } from "@/types/types";

export default async function EditSubjectPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  let subject: Subject | null = null;

  try {
    subject = (await fetchHelperServer(
      `/api/admin/subjects/${params.id}`
    )) as Subject;
  } catch (error) {
    console.error("Failed to fetch subject:", error);
  }

  if (!subject) {
    return <div>Subject not found</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-5">Edit Subject</h1>
      <SubjectEditForm subject={subject} />
    </div>
  );
}
