export type Reporter = {
  id: string;
  name: string;
  /** Paper / tenant name, e.g. "Kaburlu Daily" */
  paper: string;
  /** Mandal id from /geo/telangana-mandals.json, e.g. "nalgonda--miryalaguda" */
  mandalId: string;
  phone?: string;
  /** e.g. "Staff Reporter", "Stringer", "District Incharge" */
  role?: string;
};

export type MandalProps = {
  id: string;
  name: string;
  districtId: string;
  district: string;
  /** [lng, lat] point guaranteed inside the mandal — where the pin is drawn */
  pin?: [number, number];
};

export type DistrictProps = {
  id: string;
  name: string;
};
