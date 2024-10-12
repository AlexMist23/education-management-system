"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { postHelperClient, getHelperClient } from "@/lib/fetch-helper-client";
import { Schedule, Subject, Teacher } from "@/types/db";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const startTimes = ["08:00", "09:40", "11:40", "13:20", "15:00"] as const;
const endTimes = ["09:30", "11:10", "13:10", "14:50", "16:30"] as const;

const lectureSchema = z.object({
  subject_id: z.number().min(1, "Subject is required"),
  teacher_id: z.number().min(1, "Teacher is required"),
  start_time: z.enum(startTimes),
  end_time: z.enum(endTimes),
  room: z.string().nullable(),
});

const formSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in YYYY-MM-DD format",
  }),
  lectures: z.array(lectureSchema),
});

interface ScheduleFormProps {
  onScheduleAdded: (schedule: Schedule) => void;
}

export function ScheduleForm({ onScheduleAdded }: ScheduleFormProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: "",
      lectures: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lectures",
  });

  useEffect(() => {
    const fetchSubjectsAndTeachers = async () => {
      setIsLoadingData(true);
      try {
        const [fetchedSubjects, teachersResponse] = await Promise.all([
          getHelperClient<Subject[]>("/api/admin/subjects"),
          getHelperClient<{ teachers: Teacher[] }>("/api/admin/teachers"),
        ]);
        if (Array.isArray(fetchedSubjects)) {
          setSubjects(fetchedSubjects);
        } else {
          console.error("Fetched subjects is not an array:", fetchedSubjects);
          setSubjects([]);
        }
        if (teachersResponse && Array.isArray(teachersResponse.teachers)) {
          setTeachers(teachersResponse.teachers);
        } else {
          console.error("Fetched teachers is not an array:", teachersResponse);
          setTeachers([]);
        }
      } catch (error) {
        console.error("Failed to fetch subjects and teachers:", error);
        toast({
          title: "Error",
          description: "Failed to load subjects and teachers",
          variant: "destructive",
        });
        setSubjects([]);
        setTeachers([]);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchSubjectsAndTeachers();
  }, []);

  const getTeachersForSubject = (subjectId: number) => {
    return teachers.filter((teacher) =>
      teacher.subject_ids.includes(subjectId)
    );
  };

  const handleSubjectChange = (index: number, subjectId: number) => {
    form.setValue(`lectures.${index}.subject_id`, subjectId);
    const availableTeachers = getTeachersForSubject(subjectId);
    if (availableTeachers.length > 0) {
      form.setValue(`lectures.${index}.teacher_id`, availableTeachers[0].id);
    } else {
      form.setValue(`lectures.${index}.teacher_id`, 0);
    }
  };

  const handleStartTimeChange = (index: number, startTime: string) => {
    form.setValue(`lectures.${index}.start_time`, startTime);
    const startIndex = startTimes.indexOf(startTime as any);
    if (startIndex !== -1 && startIndex + 1 < endTimes.length) {
      form.setValue(`lectures.${index}.end_time`, endTimes[startIndex + 1]);
    }
  };

  const addNewLecture = () => {
    const newIndex = fields.length;
    const initialStartTime = startTimes[newIndex % startTimes.length];
    const startIndex = startTimes.indexOf(initialStartTime);
    const initialEndTime = endTimes[startIndex];

    append({
      subject_id: 0,
      teacher_id: 0,
      start_time: initialStartTime,
      end_time: initialEndTime,
      room: "",
    });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const newSchedule = await postHelperClient<Schedule>(
        "/api/admin/schedules",
        values
      );
      onScheduleAdded(newSchedule);
      form.reset();
      toast({
        title: "Success",
        description: "Schedule added successfully",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to add schedule",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoadingData) {
    return <div>Loading subjects and teachers...</div>;
  }

  if (subjects.length === 0 || teachers.length === 0) {
    return (
      <div>
        <p>
          Unable to create a schedule. Please ensure that subjects and teachers
          have been added to the system.
        </p>
        <p>Subjects available: {subjects.length}</p>
        <p>Teachers available: {teachers.length}</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/6">Subject</TableHead>
                <TableHead className="w-1/6">Teacher</TableHead>
                <TableHead className="w-1/6">Start Time</TableHead>
                <TableHead className="w-1/6">End Time</TableHead>
                <TableHead className="w-1/6">Room</TableHead>
                <TableHead className="w-1/6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell className="w-1/6">
                    <FormField
                      control={form.control}
                      name={`lectures.${index}.subject_id`}
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            onValueChange={(value) =>
                              handleSubjectChange(index, parseInt(value, 10))
                            }
                            value={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select subject" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {subjects.map((subject) => (
                                <SelectItem
                                  key={subject.id}
                                  value={subject.id.toString()}
                                >
                                  {subject.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell className="w-1/6">
                    <FormField
                      control={form.control}
                      name={`lectures.${index}.teacher_id`}
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value, 10))
                            }
                            value={field.value.toString()}
                            disabled={
                              !form.getValues(`lectures.${index}.subject_id`)
                            }
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select teacher" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getTeachersForSubject(
                                form.getValues(`lectures.${index}.subject_id`)
                              ).map((teacher) => (
                                <SelectItem
                                  key={teacher.id}
                                  value={teacher.id.toString()}
                                >
                                  {teacher.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell className="w-1/6">
                    <FormField
                      control={form.control}
                      name={`lectures.${index}.start_time`}
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            onValueChange={(value) =>
                              handleStartTimeChange(index, value)
                            }
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Start time" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {startTimes.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell className="w-1/6">
                    <FormField
                      control={form.control}
                      name={`lectures.${index}.end_time`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              value={field.value}
                              disabled
                              className="bg-muted"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell className="w-1/6">
                    <FormField
                      control={form.control}
                      name={`lectures.${index}.room`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} placeholder="Room" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell className="w-1/6">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => remove(index)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Button type="button" onClick={addNewLecture} className="mt-4">
          Add Lecture
        </Button>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Adding..." : "Add Schedule"}
        </Button>
      </form>
    </Form>
  );
}
