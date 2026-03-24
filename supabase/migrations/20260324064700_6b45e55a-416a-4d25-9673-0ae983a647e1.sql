CREATE POLICY "Intermediaries can delete own policies"
ON public.policies
FOR DELETE
USING (
  (intermediary_id = get_profile_id(auth.uid()))
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Intermediaries can create leads"
ON public.leads
FOR INSERT
WITH CHECK (
  (assigned_intermediary_id = get_profile_id(auth.uid()))
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR assigned_intermediary_id IS NULL
);

CREATE POLICY "Admins can delete leads"
ON public.leads
FOR DELETE
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
);