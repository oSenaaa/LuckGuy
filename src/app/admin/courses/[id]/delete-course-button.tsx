"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";

import { deleteCourse } from "../actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeleteCourseButton({
  courseId,
  courseName,
  disabled,
}: {
  courseId: string;
  courseName: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);

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
      setOpen(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive" disabled={disabled || pending}>
          {pending ? <CircleNotch size={16} className="animate-spin" /> : <Trash size={16} />}
          {pending ? "Excluindo…" : "Excluir treinamento"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir treinamento</AlertDialogTitle>
          <AlertDialogDescription>
            Excluir “{courseName}” é permanente e não pode ser desfeito.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <Button variant="destructive" disabled={pending} onClick={handleDelete}>
            {pending && <CircleNotch size={16} className="animate-spin" />}
            {pending ? "Excluindo…" : "Excluir"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
