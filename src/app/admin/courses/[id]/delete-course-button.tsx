"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";

import { deleteCourse } from "../actions";
import { Button } from "@/components/ui/button";

export function DeleteCourseButton({
  courseId,
  disabled,
}: {
  courseId: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    try {
      const formData = new FormData();
      formData.set("id", courseId);
      const result = await deleteCourse(formData);
      if (!result.ok) {
        toast.error(result.error ?? "Não foi possível excluir o treinamento.");
        return;
      }
      toast.success("Treinamento excluído.");
      router.push("/admin/courses");
    } catch {
      toast.error("Não foi possível excluir o treinamento. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button type="button" variant="destructive" disabled={disabled || pending} onClick={handleDelete}>
      {pending ? <CircleNotch size={16} className="animate-spin" /> : <Trash size={16} />}
      {pending ? "Excluindo…" : "Excluir treinamento"}
    </Button>
  );
}
